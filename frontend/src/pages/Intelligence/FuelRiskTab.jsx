import { formatInr, formatNumber } from '@/utils/redesign/format';
import { formatDateTimeIST } from '../../utils/dateUtils';
import IntelligenceDataState from './IntelligenceDataState';
import './intelFuelReference.css';
import '../Vehicle360/panels/overview/referenceOverview.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { listHotspots, getDrainMap } from '../../services/HotspotService.js';
import { fromHotspot, drainCellsOf, fuelTotals } from '../PlaceHub/model/fuelRisk.js';
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
  const [source, setSource] = useState('all');

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
      return (
        hotspots.find(
          (h) => h.id === selectedId || h.sourceId === selectedId.replace(/^hotspot:/, ''),
        ) || null
      );
    }
    return filteredCells.find((c) => c.id === selectedId) || null;
  }, [selectedId, hotspots, filteredCells]);

  const selectedKind = selectedId?.startsWith('hotspot:') ? 'hotspot' : 'drain';

  const shownHotspots = hotspots.filter(
    (hotspot) =>
      source === 'all' ||
      (source === 'network' ? hotspot.provenance === 'network' : hotspot.provenance !== 'network'),
  );
  const moneyKnown = !loading && !errors['drain map'];
  const hotspotKnown = !loading && !errors['fuel hotspots'];
  const validDate = (value) => value && Number.isFinite(new Date(value).getTime());
  const selectedTitle =
    selectedKind === 'hotspot'
      ? selectedItem?.name
      : selectedItem?.vehicles?.join(', ') || 'Parked fuel drops';
  return (
    <div className="intel-fuel-tab intel-fuel-reference">
      <section className="intel-fuel-briefing" aria-label="Fuel checks briefing">
        <div className="intel-fuel-brief-copy">
          <span>✧ Period read</span>
          <p>
            {moneyKnown ? (
              <>
                <button
                  onClick={() => {
                    setSubView('map');
                    setView('drain');
                  }}
                >
                  {formatNumber(totals.drainEvents)} parked fuel-drop events
                </button>{' '}
                were returned for this period
                {totals.drainRupees > 0
                  ? `, with an estimated value of ${formatInr(totals.drainRupees)}`
                  : ''}
                .{' '}
              </>
            ) : (
              'Parked fuel-drop totals are unavailable. '
            )}
            {hotspotKnown
              ? `${totals.active} active hotspots are marked or learned from your fleet; ${totals.network} are network hotspots.`
              : 'Hotspot records are unavailable.'}
          </p>
          <small>
            Hotspot records describe current marked or learned locations. Drain totals describe the
            selected period. These findings require evidence review before attributing fuel loss.
          </small>
        </div>
        <div className="intel-fuel-brief-kpis">
          {[
            [
              'Parked drops',
              moneyKnown ? formatNumber(totals.drainEvents) : '—',
              'Returned period events',
              'drain',
            ],
            [
              'Estimated value',
              moneyKnown ? formatInr(totals.drainRupees) : '—',
              'Value reported by the drain API',
              'drain',
            ],
            [
              'Your hotspots',
              hotspotKnown ? formatNumber(totals.active) : '—',
              'Current active locations',
              'own',
            ],
            [
              'Network hotspots',
              hotspotKnown ? formatNumber(totals.network) : '—',
              'Current shared locations',
              'network',
            ],
          ].map(([label, value, note, target]) => (
            <button
              key={label}
              onClick={() => {
                setSubView('map');
                setView(target === 'drain' ? 'drain' : 'hotspots');
                if (target !== 'drain') setSource(target);
              }}
            >
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </button>
          ))}
        </div>
      </section>
      <div className="intel-fuel-display-switch" role="tablist" aria-label="Fuel views">
        <button role="tab" aria-selected={subView === 'map'} onClick={() => setSubView('map')}>
          Risk map &amp; hotspots
        </button>
        <button
          role="tab"
          aria-selected={subView === 'instances'}
          onClick={() => setSubView('instances')}
        >
          Unexplained fuel drops log
        </button>
      </div>
      {subView === 'instances' ? (
        <div className="intel-fuel-log">
          <InstancesTab
            kind="fuel_unexplained"
            from={from}
            to={to}
            vehicle={vehicle}
            driver={driver}
          />
        </div>
      ) : (
        <section
          className="intel-fuel-map-card"
          aria-label="Fuel risk map and activity"
          aria-busy={loading}
        >
          <aside className="intel-fuel-map-sidebar">
            <header>
              <div className="intel-fuel-layer-switch" role="group" aria-label="Fuel map layers">
                <button aria-pressed={view === 'hotspots'} onClick={() => setView('hotspots')}>
                  Hotspots {hotspots.length}
                </button>
                <button aria-pressed={view === 'drain'} onClick={() => setView('drain')}>
                  Parked drops {filteredCells.length}
                </button>
              </div>
              {view === 'hotspots' ? (
                <div className="intel-fuel-source-chips" role="group" aria-label="Hotspot source">
                  {[
                    ['all', 'All'],
                    ['own', 'Your fleet'],
                    ['network', 'Network'],
                  ].map(([key, label]) => (
                    <button key={key} aria-pressed={source === key} onClick={() => setSource(key)}>
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </header>
            <IntelligenceDataState
              loading={loading}
              error={
                view === 'hotspots' && errors['fuel hotspots']
                  ? { message: errors['fuel hotspots'] }
                  : view === 'drain' && errors['drain map']
                    ? { message: errors['drain map'] }
                    : null
              }
              isEmpty={view === 'hotspots' ? !shownHotspots.length : !filteredCells.length}
              emptyMessage={
                view === 'hotspots'
                  ? 'No hotspots returned for this selection.'
                  : 'No parked drops returned for this selection.'
              }
              what="Fuel map records"
              onRetry={loadData}
            >
              <div className="intel-fuel-record-list">
                {view === 'hotspots'
                  ? shownHotspots.map((item) => (
                      <button
                        key={item.id}
                        aria-pressed={selectedId === item.id}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <div>
                          <strong>{item.name}</strong>
                          <small>
                            {item.provenance === 'network'
                              ? 'Learned across the network'
                              : item.provenance === 'own-manual'
                                ? 'Marked by your team'
                                : 'Learned from your fleet'}
                            {validDate(item.lastIncidentAt)
                              ? ` · ${formatDateTimeIST(item.lastIncidentAt)}`
                              : ''}
                          </small>
                        </div>
                        <span>
                          {item.incidentCount}
                          <small>incidents</small>
                        </span>
                      </button>
                    ))
                  : filteredCells.map((item) => (
                      <button
                        key={item.id}
                        aria-pressed={selectedId === item.id}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <div>
                          <strong>{item.vehicles.join(', ') || 'Vehicle not specified'}</strong>
                          <small>
                            {formatNumber(item.litres)} L · {item.events} events
                          </small>
                        </div>
                        <span>
                          {formatInr(item.rupees)}
                          <small>estimated value</small>
                        </span>
                      </button>
                    ))}
              </div>
            </IntelligenceDataState>
            <footer>
              {drainMap?.disclaimer ||
                'Hotspots and sensor drops indicate records to review; they do not confirm theft.'}
            </footer>
          </aside>
          <div className="intel-fuel-map-column">
            <div className="intel-fuel-map-canvas">
              <RiskMapCanvas
                type="fuel"
                hotspots={view === 'hotspots' ? shownHotspots : []}
                drainCells={view === 'drain' ? filteredCells : []}
                selectedId={selectedId}
                onSelect={setSelectedId}
                isDark={false}
              />
            </div>
            {selectedItem ? (
              <section className="intel-fuel-selected" aria-label={selectedTitle}>
                <header>
                  <div>
                    <h3>{selectedTitle}</h3>
                    <small>
                      {selectedItem.lat?.toFixed(3)}, {selectedItem.lng?.toFixed(3)}
                      {selectedItem.radiusM ? ` · ${selectedItem.radiusM} m radius` : ''}
                    </small>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    aria-label="Close selected fuel record"
                  >
                    <X size={14} />
                  </button>
                </header>
                <span className="intel-fuel-source-tag">
                  {selectedKind === 'hotspot'
                    ? selectedItem.provenance === 'network'
                      ? 'Learned across the network'
                      : selectedItem.provenance === 'own-manual'
                        ? 'Marked by your team'
                        : 'Learned from your fleet'
                    : 'Reported parked sensor drops'}
                </span>
                <p>
                  {selectedItem.raw?.description ||
                    'Review the recorded events and matching fuel receipts before determining a cause.'}
                </p>
                <div className="intel-fuel-selected-stats">
                  {(selectedKind === 'hotspot'
                    ? [
                        ['Incidents', selectedItem.incidentCount],
                        ['Category', selectedItem.category],
                        [
                          'Last incident',
                          validDate(selectedItem.lastIncidentAt)
                            ? formatDateTimeIST(selectedItem.lastIncidentAt)
                            : 'Not reported',
                        ],
                      ]
                    : [
                        ['Events', selectedItem.events],
                        ['Litres', formatNumber(selectedItem.litres)],
                        ['Estimated value', formatInr(selectedItem.rupees)],
                      ]
                  ).map(([label, value]) => (
                    <div key={label}>
                      <small>{label}</small>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
                <button className="intel-fuel-review-log" onClick={() => setSubView('instances')}>
                  Review fuel-drop records →
                </button>
              </section>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
