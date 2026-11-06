import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Flame, Droplets } from 'lucide-react';
import { listHotspots, getDrainMap } from '../../services/HotspotService.js';
import { fromHotspot, drainCellsOf, fuelTotals } from '../PlaceHub/model/fuelRisk.js';
import FuelPanel from '../PlaceHub/panels/FuelPanel.jsx';
import HotspotDetail from '../PlaceHub/drawer/HotspotDetail.jsx';
import DrainDetail from '../PlaceHub/drawer/DrainDetail.jsx';
import useHtmlDark from '../PlaceHub/page/useHtmlDark.js';
import InstancesTab from './InstancesTab';
import RiskMapCanvas from './RiskMapCanvas';
import '../PlaceHub/PlaceHub.css';
import './IntelligencePage.css';

const isCanceled = (error) => error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED';

export default function FuelRiskTab({ from, to, vehicle = '', driver = '' }) {
  const [searchParams] = useSearchParams();
  const [subView, setSubView] = useState('map'); // 'map' | 'instances'
  const [view, setView] = useState('hotspots'); // 'hotspots' | 'drain'

  // Pre-select hotspot if deep linked from alert inbox
  const initialHotspot = searchParams.get('hotspot');
  const [selectedId, setSelectedId] = useState(() =>
    initialHotspot ? `hotspot:${initialHotspot}` : null,
  );

  const [hotspots, setHotspots] = useState([]);
  const [drainMap, setDrainMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const isDark = useHtmlDark();

  const controllerRef = useRef(null);

  const loadData = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const signal = controller.signal;

    setLoading(true);
    setErrors({});

    try {
      const [hotspotRes, drainRes] = await Promise.all([
        listHotspots({ signal }).catch((err) => {
          if (isCanceled(err)) throw err;
          setErrors((e) => ({ ...e, 'fuel hotspots': 'Could not load fuel hotspots' }));
          return [];
        }),
        getDrainMap({ from, to, signal }).catch((err) => {
          if (isCanceled(err)) throw err;
          setErrors((e) => ({ ...e, 'drain map': 'Could not load drain map' }));
          return null;
        }),
      ]);

      if (signal.aborted) return;
      setHotspots((hotspotRes || []).map(fromHotspot));
      setDrainMap(drainRes);
      setLoading(false);
    } catch (err) {
      if (!isCanceled(err)) {
        setLoading(false);
      }
    }
  }, [from, to]);

  useEffect(() => {
    loadData();
    return () => {
      controllerRef.current?.abort();
    };
  }, [loadData]);

  const drainCells = useMemo(() => drainCellsOf(drainMap), [drainMap]);

  // Vehicle filter support
  const filteredCells = useMemo(() => {
    if (!vehicle) return drainCells;
    const v = vehicle.trim().toLowerCase();
    return drainCells.filter((c) => c.vehicles?.some((veh) => veh.toLowerCase().includes(v)));
  }, [drainCells, vehicle]);

  const totals = useMemo(() => fuelTotals(hotspots, filteredCells), [hotspots, filteredCells]);

  // Selected item
  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    if (selectedId.startsWith('hotspot:')) {
      return hotspots.find((h) => h.id === selectedId || h.sourceId === selectedId.replace(/^hotspot:/, '')) || null;
    }
    return filteredCells.find((c) => c.id === selectedId) || null;
  }, [selectedId, hotspots, filteredCells]);

  const selectedKind = selectedId?.startsWith('hotspot:') ? 'hotspot' : 'drain';

  return (
    <div className="intel-fuel-tab">
      <div className="intel-subview-toggle-bar">
        <div role="tablist" aria-label="Fuel views" className="intel-segmented">
          <button
            type="button"
            role="tab"
            aria-selected={subView === 'map'}
            className="intel-segment"
            onClick={() => setSubView('map')}
          >
            <Flame size={14} aria-hidden="true" />
            Risk map & hotspots
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subView === 'instances'}
            className="intel-segment"
            onClick={() => setSubView('instances')}
          >
            <Droplets size={14} aria-hidden="true" />
            Unexplained fuel drops log
          </button>
        </div>
      </div>

      {subView === 'instances' ? (
        <InstancesTab kind="fuel_unexplained" from={from} to={to} vehicle={vehicle} driver={driver} />
      ) : (
        <div className={`ph-page intel-embed-console ph-body ${selectedItem ? 'has-panel' : ''}`}>
          <div className="ph-side">
            <FuelPanel
              loading={loading}
              view={view}
              onView={setView}
              hotspots={hotspots}
              cells={filteredCells}
              totals={totals}
              disclaimer={drainMap?.disclaimer}
              errors={errors}
              selectedId={selectedId}
              onPickHotspot={(item) => setSelectedId(item.id)}
              onPickCell={(item) => setSelectedId(item.id)}
            />
          </div>
          <div className="ph-map-wrap" style={{ position: 'relative', minHeight: '520px' }}>
            <RiskMapCanvas
              type="fuel"
              hotspots={hotspots}
              drainCells={filteredCells}
              selectedId={selectedId}
              onSelect={setSelectedId}
              isDark={isDark}
            />
          </div>
          {selectedItem && (
            selectedKind === 'hotspot' ? (
              <HotspotDetail
                hotspot={selectedItem}
                canEdit={false}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <DrainDetail
                cell={selectedItem}
                canEdit={false}
                onClose={() => setSelectedId(null)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

