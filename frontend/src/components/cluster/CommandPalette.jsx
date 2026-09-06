import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, Search, Truck, IdCard, Compass, Route, Activity, X, Loader2, CloudOff } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { FleetDataService } from '../../services/FleetDataService';
import { VehicleService } from '../../pages/Profile/VehicleService';
import { searchAll } from '../../services/searchService';
import { label as vocabLabel } from '../../lib/vocabulary';

/**
 * CommandPalette — global jump palette (⌘K / Ctrl+K).
 *
 * Empty query  : fleet health strip (instant, client-side).
 * 1 char       : local vehicle filter on the same strip.
 * 2+ chars     : live search across vehicles, drivers, trips, routes
 *                (GET /api/search, debounced 200 ms, abortable). If the
 *                search call fails, falls back to the local vehicle list
 *                and says so — it never renders failure as "no results".
 *
 * Keys: Esc close · ↑/↓ select · Enter go.
 */

const TYPE_ICON = {
  VEHICLE: Truck,
  DRIVER: IdCard,
  TRIP: Compass,
  ROUTE: Route,
};

const SEARCH_MIN_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 200;

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [serverResults, setServerResults] = useState(null); // null = not in server mode
  const [serverState, setServerState] = useState('idle'); // idle | pending | error
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const navigate = useNavigate();

  const { data: healthData, loading: healthLoading } = useApi(
    (signal) => FleetDataService.getFleetHealth(signal),
    [],
  );
  const { data: fleetDash, loading: fleetLoading } = useApi(
    (signal) => VehicleService.getFleetDashboard(null, '', { signal }),
    [],
  );

  const vehicles = useMemo(() => {
    const map = new Map();
    const add = (reg, source, meta = {}) => {
      if (!reg) return;
      const existing = map.get(reg);
      map.set(reg, { registrationNumber: reg, source, ...meta, ...existing });
    };

    (healthData?.vehicles || []).forEach((v) => {
      add(v.registrationNumber, 'telemetry', {
        fuelLevel: v.primaryFuelLevel,
        defLevel: v.defLevel,
        isStale: v.isStale,
      });
    });

    (fleetDash || []).forEach((v) => {
      add(v.registrationNumber, 'fleet-master', {
        model: v.model || v.vehicleModel,
        status: v.status,
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.registrationNumber.localeCompare(b.registrationNumber),
    );
  }, [healthData, fleetDash]);

  const localFiltered = useMemo(() => {
    const q = query.trim().toUpperCase().replace(/\s+/g, '');
    if (!q) return vehicles;
    return vehicles.filter((i) =>
      i.registrationNumber.toUpperCase().replace(/\s+/g, '').includes(q),
    );
  }, [vehicles, query]);

  const inServerMode = query.trim().length >= SEARCH_MIN_CHARS;

  // Debounced live search once the query is long enough.
  useEffect(() => {
    if (!open || !inServerMode) {
      setServerResults(null);
      setServerState('idle');
      return undefined;
    }
    setServerState('pending');
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      searchAll(query.trim(), { signal: controller.signal })
        .then((results) => {
          if (controller.signal.aborted) return;
          setServerResults(results);
          setServerState('idle');
        })
        .catch((err) => {
          if (controller.signal.aborted || err?.code === 'ERR_CANCELED') return;
          setServerResults(null);
          setServerState('error');
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [open, inServerMode, query]);

  // Unified display items: server results when active, else local vehicles.
  const items = useMemo(() => {
    if (inServerMode && serverResults) {
      return serverResults.map((r) => ({
        key: `${r.type}:${r.id}`,
        type: r.type,
        title: r.label,
        sub: r.type === 'TRIP' ? vocabLabel('status', r.sub) : r.sub,
        url: r.url,
      }));
    }
    return localFiltered.map((v) => ({
      key: `LOCAL:${v.registrationNumber}`,
      type: 'VEHICLE',
      title: v.registrationNumber,
      sub: v.model || (v.status ? vocabLabel('status', v.status) : '') || 'Vehicle',
      url: `/vehicles/${encodeURIComponent(v.registrationNumber)}`,
      fuelLevel: v.fuelLevel,
      isStale: v.isStale,
    }));
  }, [inServerMode, serverResults, localFiltered]);

  useEffect(() => {
    setIndex(0);
  }, [items.length]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      setServerResults(null);
      setServerState('idle');
      // focus on next tick so the modal is rendered
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = items[index];
        if (selected) {
          navigate(selected.url);
          setOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, index, navigate]);

  if (!open) return null;

  const localLoading = healthLoading || fleetLoading;
  const pending = inServerMode && serverState === 'pending';
  const serverError = inServerMode && serverState === 'error';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(4, 8, 16, 0.65)', backdropFilter: 'blur(3px)' }}
      role="presentation"
      onClick={() => setOpen(false)}
    >
      <div
        className="cluster-panel w-full overflow-hidden"
        style={{ maxWidth: 560, maxHeight: '70vh' }}
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid var(--hairline)' }}
        >
          <Search size={18} className="text-dim" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vehicles, drivers, trips, routes…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--cluster-text)' }}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex items-center gap-1.5">
            <kbd
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ background: 'var(--glass-hi)', color: 'var(--cluster-text-dim)' }}
            >
              ESC
            </kbd>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 hover:opacity-70"
              style={{ color: 'var(--cluster-text-dim)' }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {pending && !items.length && (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-dim">
            <Loader2 size={16} className="animate-spin" />
            Searching…
          </div>
        )}

        {!pending && serverError && (
          <div className="flex items-center justify-center gap-2 p-4 text-xs" style={{ color: 'var(--caution)' }}>
            <CloudOff size={14} />
            Live search unavailable — showing fleet vehicles only.
          </div>
        )}

        {!pending && !localLoading && items.length === 0 && !serverError && (
          <div className="p-8 text-center text-sm text-dim">
            {inServerMode ? 'Nothing found across vehicles, drivers, trips or routes.' : 'No vehicles found.'}
          </div>
        )}

        {items.length > 0 && (
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 120px)' }}>
            {items.map((item, i) => {
              const active = i === index;
              const Icon = TYPE_ICON[item.type] || Truck;
              return (
                <button
                  key={item.key}
                  type="button"
                  className="w-full text-left transition-colors"
                  style={{
                    background: active ? 'var(--glass-hi)' : 'transparent',
                    color: 'var(--cluster-text)',
                    borderBottom: '1px solid var(--hairline)',
                  }}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => {
                    navigate(item.url);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Icon size={16} className="text-dim" />
                      <div>
                        <div className="text-sm font-medium">
                          {item.title}
                        </div>
                        <div className="text-xs text-dim">
                          {item.sub || item.type.charAt(0) + item.type.slice(1).toLowerCase()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.fuelLevel != null && (
                        <div className="flex items-center gap-1 text-xs text-dim">
                          <Activity size={12} />
                          {Math.round(item.fuelLevel)}%
                          {item.isStale && <span className="text-[10px] signal-caution">stale</span>}
                        </div>
                      )}
                      <Command size={14} className="text-dim opacity-50" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div
          className="flex items-center justify-between px-4 py-2 text-[11px] text-dim"
          style={{ borderTop: '1px solid var(--hairline)', background: 'var(--glass)' }}
        >
          <span>
            {inServerMode
              ? `${items.length} result${items.length === 1 ? '' : 's'} · vehicles, drivers, trips, routes`
              : `${items.length} vehicle${items.length === 1 ? '' : 's'}`}
          </span>
          <span className="flex items-center gap-2">
            <span>↑↓ select</span>
            <span>↵ open</span>
          </span>
        </div>
      </div>
    </div>
  );
}
