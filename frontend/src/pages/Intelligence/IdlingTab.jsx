import { IntelligenceViewSwitcher, IntelligenceMapWorkspace } from './IntelligenceWorkspace.jsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Timer } from 'lucide-react';
import IdlingConsoleService from '../IdlingConsole/IdlingConsoleService.js';
import PlaceHubService from '../PlaceHub/PlaceHubService.js';
import {
  clusterIdleEvents,
  idleHistoryTotals,
  liveIdleTotals,
} from '../PlaceHub/model/idleSpots.js';
import IdlingPanel from '../PlaceHub/panels/IdlingPanel.jsx';
import LiveIdleDetail from '../PlaceHub/drawer/LiveIdleDetail.jsx';
import IdleSpotDetail from '../PlaceHub/drawer/IdleSpotDetail.jsx';
import useHtmlDark from '../PlaceHub/page/useHtmlDark.js';
import InstancesTab from './InstancesTab';
import RiskMapCanvas from './RiskMapCanvas';
import '../PlaceHub/PlaceHub.css';
import './IntelligencePage.css';

const IDLE_PAGE_SIZE = 100;
const MAX_IDLE_PAGES = 5;

const isCanceled = (error) => error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED';

export default function IdlingTab({ from, to, vehicle = '', driver = '' }) {
  const [subView, setSubView] = useState('map'); // 'map' | 'instances'
  const [view, setView] = useState('live'); // 'live' | 'spots'
  const [selectedId, setSelectedId] = useState(null);

  const [live, setLive] = useState([]);
  const [history, setHistory] = useState([]);
  const [truncated, setTruncated] = useState(false);
  const [idleSetting, setIdleSetting] = useState(null);
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
      const fromDate = from || new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

      const [liveRes, historyPages, settingRes] = await Promise.all([
        IdlingConsoleService.getLive({ signal }).catch((err) => {
          if (isCanceled(err)) throw err;
          setErrors((e) => ({ ...e, 'live idling': 'Could not load live idling' }));
          return [];
        }),
        (async () => {
          let rows = [];
          let wasTruncated = false;
          try {
            for (let page = 1; page <= MAX_IDLE_PAGES; page++) {
              const res = await IdlingConsoleService.getHistory(
                { from: fromDate, page, limit: IDLE_PAGE_SIZE },
                { signal },
              );
              rows = rows.concat(res.data || []);
              if (page >= (res.meta?.totalPages || 1)) break;
              if (page === MAX_IDLE_PAGES && res.meta?.totalPages > MAX_IDLE_PAGES) {
                wasTruncated = true;
              }
            }
          } catch (err) {
            if (isCanceled(err)) throw err;
            setErrors((e) => ({ ...e, 'idle history': 'Could not load idle history' }));
          }
          return { rows, wasTruncated };
        })(),
        PlaceHubService.loadIdleSetting({ signal }).catch((err) => {
          if (isCanceled(err)) throw err;
          return null;
        }),
      ]);

      if (signal.aborted) return;
      setLive(liveRes || []);
      setHistory(historyPages.rows || []);
      setTruncated(historyPages.wasTruncated);
      setIdleSetting(settingRes);
      setLoading(false);
    } catch (err) {
      if (!isCanceled(err)) {
        setLoading(false);
      }
    }
  }, [from]);

  useEffect(() => {
    loadData();
    return () => {
      controllerRef.current?.abort();
    };
  }, [loadData]);

  // Periodic refresh for live idling every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (subView === 'map' && view === 'live') {
        IdlingConsoleService.getLive()
          .then((data) => {
            if (Array.isArray(data)) setLive(data);
          })
          .catch(() => {});
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [subView, view]);

  // Vehicle filter support
  const filteredLive = useMemo(() => {
    if (!vehicle) return live;
    const v = vehicle.trim().toLowerCase();
    return live.filter((e) => (e.registrationNumber || '').toLowerCase().includes(v));
  }, [live, vehicle]);

  const spots = useMemo(() => clusterIdleEvents(history), [history]);

  const filteredSpots = useMemo(() => {
    if (!vehicle) return spots;
    const v = vehicle.trim().toLowerCase();
    return spots.filter((s) => s.trucks?.some((t) => t.toLowerCase().includes(v)));
  }, [spots, vehicle]);

  const liveTotals = useMemo(() => liveIdleTotals(filteredLive), [filteredLive]);
  const historyTotals = useMemo(() => idleHistoryTotals(history), [history]);

  // Selected item
  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    if (selectedId.startsWith('live:')) {
      const id = selectedId.replace(/^live:/, '');
      return filteredLive.find((e) => String(e._id) === id) || null;
    }
    return filteredSpots.find((s) => s.id === selectedId) || null;
  }, [selectedId, filteredLive, filteredSpots]);

  const selectedKind = selectedId?.startsWith('live:') ? 'live' : 'idleSpot';

  return (
    <div className="intel-idling-tab">
      <IntelligenceViewSwitcher label="Idling views">
        <button
          type="button"
          role="tab"
          aria-selected={subView === 'map'}
          className="intel-segment"
          onClick={() => setSubView('map')}
        >
          <MapPin size={14} aria-hidden="true" />
          Live & spots map
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subView === 'instances'}
          className="intel-segment"
          onClick={() => setSubView('instances')}
        >
          <Timer size={14} aria-hidden="true" />
          Idle moments log
        </button>
      </IntelligenceViewSwitcher>

      {subView === 'instances' ? (
        <InstancesTab kind="idle" from={from} to={to} vehicle={vehicle} driver={driver} />
      ) : (
        <IntelligenceMapWorkspace
          label="Idling map and activity"
          hasDetail={Boolean(selectedItem)}
          loading={loading}
        >
          <div className="ph-side">
            <IdlingPanel
              loading={loading}
              view={view}
              onView={setView}
              live={filteredLive}
              liveTotals={liveTotals}
              spots={filteredSpots}
              historyTotals={historyTotals}
              truncated={truncated}
              idleSetting={idleSetting}
              errors={errors}
              selectedId={selectedId}
              onPickLive={(item) => setSelectedId(`live:${item._id}`)}
              onPickSpot={(item) => setSelectedId(item.id)}
            />
          </div>
          <div className="ph-map-wrap">
            <RiskMapCanvas
              type="idling"
              idleLive={filteredLive}
              idleSpots={filteredSpots}
              selectedId={selectedId}
              onSelect={setSelectedId}
              isDark={isDark}
            />
          </div>
          {selectedItem &&
            (selectedKind === 'live' ? (
              <LiveIdleDetail
                event={selectedItem}
                canEdit={false}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <IdleSpotDetail
                spot={selectedItem}
                canEdit={false}
                onClose={() => setSelectedId(null)}
              />
            ))}
        </IntelligenceMapWorkspace>
      )}
    </div>
  );
}
