import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, Search, Truck, Activity, X, Loader2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { FleetDataService } from '../../services/FleetDataService';
import { VehicleService } from '../../pages/Profile/VehicleService';

/**
 * CommandPalette — vehicle jump palette.
 *
 * Shortcuts:
 *   ⌘K / Ctrl+K   open
 *   Esc             close
 *   ↑ / ↓           navigate items
 *   Enter           go to /vehicles/:registrationNumber
 *   g o             go Overview (future routing layer)
 *   g f             go Fuel Spend (future routing layer)
 *
 * For now the palette fetches the fleet master + latest telemetry health strip
 * and deduplicates by registration number. Typing filters the list.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { data: healthData, loading: healthLoading } = useApi(
    (signal) => FleetDataService.getFleetHealth(signal),
    [],
  );
  const { data: fleetDash, loading: fleetLoading } = useApi(
    (signal) => VehicleService.getFleetDashboard(null, '', { signal }),
    [],
  );

  const items = useMemo(() => {
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

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase().replace(/\s+/g, '');
    if (!q) return items;
    return items.filter((i) =>
      i.registrationNumber.toUpperCase().replace(/\s+/g, '').includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    setIndex(0);
  }, [filtered.length]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
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
        setIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filtered[index];
        if (selected) {
          navigate(`/vehicles/${encodeURIComponent(selected.registrationNumber)}`);
          setOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, index, navigate]);

  if (!open) return null;

  const loading = healthLoading || fleetLoading;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(4, 8, 16, 0.65)', backdropFilter: 'blur(3px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="cluster-panel w-full overflow-hidden"
        style={{ maxWidth: 560, maxHeight: '70vh' }}
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
            placeholder="Jump to vehicle by registration..."
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

        {loading && !filtered.length && (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-dim">
            <Loader2 size={16} className="animate-spin" />
            Loading vehicles...
          </div>
        )}

        {!loading && !filtered.length && (
          <div className="p-8 text-center text-sm text-dim">
            {items.length === 0
              ? 'No vehicles found.'
              : 'No vehicles match your search.'}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 120px)' }}>
            {filtered.map((item, i) => {
              const active = i === index;
              return (
                <button
                  key={item.registrationNumber}
                  type="button"
                  className="w-full text-left transition-colors"
                  style={{
                    background: active ? 'var(--glass-hi)' : 'transparent',
                    color: 'var(--cluster-text)',
                    borderBottom: '1px solid var(--hairline)',
                  }}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => {
                    navigate(`/vehicles/${encodeURIComponent(item.registrationNumber)}`);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Truck size={16} className="text-dim" />
                      <div>
                        <div className="text-sm font-medium">
                          {item.registrationNumber}
                        </div>
                        <div className="text-xs text-dim">
                          {item.model || item.status || 'Vehicle'}
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
          <span>{filtered.length} vehicle{filtered.length === 1 ? '' : 's'}</span>
          <span className="flex items-center gap-2">
            <span>↑↓ select</span>
            <span>↵ open</span>
          </span>
        </div>
      </div>
    </div>
  );
}
