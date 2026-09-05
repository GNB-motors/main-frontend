import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, useLoadScript, MarkerF, PolylineF } from '@react-google-maps/api';
import { AlertTriangle, Loader2, Navigation, RefreshCw, Search, ArrowRight } from 'lucide-react';
import SlideOver from '../../components/cluster/SlideOver.jsx';
import FreshnessBadge from '../../components/cluster/FreshnessBadge.jsx';
import FleetEdgeStatusChip from '../../components/Fleet/FleetEdgeStatusChip.jsx';
import SetupChecklist from '../../components/Fleet/SetupChecklist.jsx';
import { LiveTrackingService } from '../LiveTracking/LiveTrackingService.jsx';
import {
  INDIA_CENTER,
  POLL_INTERVAL_MS,
  STATE_META,
  getStateMeta,
  formatIST,
  formatRelativeIST,
  pinIcon,
  withCoordinates,
  fitMapToPositions,
} from '../LiveTracking/liveTracking.shared.js';

/**
 * LiveConsole — the fleet map as a console rather than a panel on a dashboard.
 *
 * What changed from LiveTrackingPage:
 *
 *  - It fills the viewport. The old page was a fixed 560px map inside a
 *    scrolling column; this is a flex column that never scrolls the page, so
 *    the map grows with the window (see .fleet-fill in index.css).
 *  - The vehicle list is searchable and filterable. At 100+ vehicles an
 *    unfiltered, unsearchable list is not usable, and that was the only way to
 *    find a truck.
 *  - Clicking a vehicle opens a drawer, not a Google InfoWindow. An InfoWindow
 *    re-centres the map and closes on the next poll; the drawer keeps the map
 *    exactly where the user put it. Reuses components/cluster/SlideOver.
 *  - It no longer borrows FuelComparison.css. The old page did
 *    `import '../FuelComparison/FuelComparison.css'` for its fc-* classes, so
 *    restyling fuel comparison silently restyled live tracking.
 *
 * Deliberately NOT done here, both noted for follow-up:
 *  - Marker clustering. There is no clusterer in the project and adding
 *    @googlemaps/markerclusterer is a new dependency; at ~1,000 vehicles the
 *    pins will need it.
 *  - Reverse geocoding the selected vehicle. CLAUDE.md prices the naive
 *    version (per position / in a loop) at ~$30,500/month at 1,000 vehicles,
 *    so the drawer shows coordinates and a Maps link instead of an address.
 *    If addresses are wanted, resolve one point on click and cache it.
 */

const MAP_STYLE = { width: '100%', height: '100%' };
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'PARKED', label: 'Parked' },
  { id: 'OFFLINE', label: 'Offline' },
];

/**
 * pinIcon() builds a fresh object every call, and a new `icon` identity makes
 * Google redraw the marker — so on every 45s poll every pin flickered. Markers
 * are keyed by registration and only their position changes; caching the icon
 * per (colour, dimmed) keeps their identity stable across polls.
 */
const iconCache = new Map();
const cachedPin = (color, dimmed) => {
  const key = `${color}|${dimmed ? 1 : 0}`;
  if (!iconCache.has(key)) iconCache.set(key, pinIcon(color, dimmed));
  return iconCache.get(key);
};

const Row = ({ v, selected, onSelect }) => {
  const meta = getStateMeta(v.state);
  return (
    <button
      type="button"
      className="lc-row"
      data-selected={selected ? 'true' : undefined}
      onClick={() => onSelect(selected ? null : v.registrationNumber)}
    >
      <span className="lc-dot" style={{ backgroundColor: meta.color }} />
      <span className="lc-row-main">
        <span className="lc-row-reg">{v.registrationNumber || v.vin || '—'}</span>
        <span className="lc-row-sub">
          {meta.label}
          {v.isStale ? ' · stale' : ''}
          {v.eventDateTime ? ` · ${formatRelativeIST(v.eventDateTime) || ''}` : ''}
        </span>
      </span>
      {v.state === 'ACTIVE' && v.speed != null && (
        <span className="lc-row-speed">{Math.round(v.speed)} km/h</span>
      )}
    </button>
  );
};

const LiveConsole = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastPolledAt, setLastPolledAt] = useState(null);

  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [selectedReg, setSelectedReg] = useState(null);

  const [trail, setTrail] = useState([]);
  const [trailLoading, setTrailLoading] = useState(false);
  const [showTrail, setShowTrail] = useState(false);

  const mapRef = useRef(null);
  const inFlight = useRef(false);
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const fetchPositions = useCallback(async ({ initial = false } = {}) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      setPositions(await LiveTrackingService.getPositions());
      setError(null);
      setLastPolledAt(new Date());
    } catch (err) {
      setError(err.detail || 'Could not load live positions.');
    } finally {
      inFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions({ initial: true });
    const id = setInterval(fetchPositions, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchPositions]);

  // Trail is opt-in per selection: it is a second request, and most of the time
  // the user only wants to know where the vehicle is now.
  useEffect(() => {
    if (!selectedReg || !showTrail) {
      setTrail([]);
      return undefined;
    }
    let cancelled = false;
    setTrailLoading(true);
    LiveTrackingService.getTrail(selectedReg)
      .then((data) => {
        if (cancelled) return;
        setTrail(
          (data.points || [])
            .filter((p) => p.latitude != null && p.longitude != null)
            .map((p) => ({ lat: p.latitude, lng: p.longitude })),
        );
      })
      .catch(() => !cancelled && setTrail([]))
      .finally(() => !cancelled && setTrailLoading(false));
    return () => { cancelled = true; };
  }, [selectedReg, showTrail]);

  const counts = useMemo(() => {
    const c = { ALL: positions.length, ACTIVE: 0, PARKED: 0, OFFLINE: 0 };
    positions.forEach((p) => { if (c[p.state] != null) c[p.state] += 1; });
    return c;
  }, [positions]);

  const visible = useMemo(() => {
    const q = query.trim().toUpperCase().replace(/\s+/g, '');
    return positions.filter((p) => {
      if (filter !== 'ALL' && p.state !== filter) return false;
      if (!q) return true;
      return (p.registrationNumber || p.vin || '').toUpperCase().replace(/\s+/g, '').includes(q);
    });
  }, [positions, filter, query]);

  const located = useMemo(() => withCoordinates(visible), [visible]);
  const selected = positions.find((p) => p.registrationNumber === selectedReg) || null;

  // Fit to the vehicles actually shown, so filtering reframes the map.
  useEffect(() => {
    if (isLoaded && mapRef.current) fitMapToPositions(mapRef.current, located);
  }, [isLoaded, located]);

  const selectVehicle = (reg) => {
    setSelectedReg(reg);
    setShowTrail(false);
    const v = positions.find((p) => p.registrationNumber === reg);
    if (v?.latitude != null && mapRef.current) {
      mapRef.current.panTo({ lat: v.latitude, lng: v.longitude });
    }
  };

  return (
    <div className="live-console">
      <div className="lc-toolbar">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="fleet-facet"
              data-active={filter === f.id ? 'true' : undefined}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              <span
                className="lc-dot"
                style={{ backgroundColor: f.id === 'ALL' ? 'var(--cluster-text-dim)' : STATE_META[f.id].color }}
              />
              {f.label} {counts[f.id]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stale pins have a cause; this names it and links to the fix. */}
          <FleetEdgeStatusChip />
          <FreshnessBadge at={lastPolledAt?.toISOString()} prefix="Synced" />
          <label className="fleet-search">
            <Search size={15} />
            <input
              type="search"
              value={query}
              placeholder="Find a vehicle…"
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Find a vehicle by registration"
            />
          </label>
          <button type="button" className="ov-btn" onClick={() => fetchPositions()} disabled={refreshing}>
            {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
          style={{ background: 'color-mix(in srgb, var(--critical) 10%, transparent)', color: 'var(--critical)' }}
        >
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* Nothing is reporting: show the way forward rather than an empty list
          beside an empty map. The checklist works out whether that means "no
          vehicles yet" or "vehicles but no FleetEdge connected". */}
      {!loading && positions.length === 0 && !error ? (
        <div className="lc-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <SetupChecklist />
        </div>
      ) : (
      <div className="lc-body">
        <aside className="lc-list">
          <div className="lc-list-scroll">
            {loading && positions.length === 0 ? (
              <div className="text-dim flex items-center gap-2 p-3 text-xs">
                <Loader2 size={14} className="animate-spin" /> Loading positions…
              </div>
            ) : visible.length === 0 ? (
              <p className="text-dim p-3 text-xs">
                {positions.length === 0
                  ? 'No live positions yet. Vehicles appear here once FleetEdge reports them.'
                  : 'No vehicles match this filter.'}
              </p>
            ) : (
              visible.map((v) => (
                <Row
                  key={v.registrationNumber || v.vin}
                  v={v}
                  selected={v.registrationNumber === selectedReg}
                  onSelect={selectVehicle}
                />
              ))
            )}
          </div>
        </aside>

        <div className="lc-map">
          {!isLoaded ? (
            <div className="text-dim flex h-full items-center justify-center gap-2 text-sm">
              <Loader2 size={18} className="animate-spin" /> Loading map…
            </div>
          ) : located.length === 0 && !loading ? (
            <div className="text-dim flex h-full flex-col items-center justify-center gap-2 text-sm">
              <Navigation size={32} className="opacity-30" />
              No vehicles with coordinates right now
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={MAP_STYLE}
              center={INDIA_CENTER}
              zoom={5}
              onLoad={(map) => { mapRef.current = map; fitMapToPositions(map, located); }}
              onUnmount={() => { mapRef.current = null; }}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
            >
              {located.map((v) => {
                const meta = getStateMeta(v.state);
                return (
                  <MarkerF
                    key={v.registrationNumber || v.vin}
                    position={{ lat: v.latitude, lng: v.longitude }}
                    title={v.registrationNumber || v.vin}
                    icon={cachedPin(meta.color, v.isStale || v.state === 'OFFLINE')}
                    onClick={() => selectVehicle(v.registrationNumber)}
                  />
                );
              })}
              {showTrail && trail.length > 1 && (
                <PolylineF path={trail} options={{ strokeColor: '#2563EB', strokeOpacity: 0.9, strokeWeight: 4 }} />
              )}
            </GoogleMap>
          )}
        </div>
      </div>
      )}

      <SlideOver
        open={Boolean(selected)}
        onClose={() => setSelectedReg(null)}
        title={selected?.registrationNumber || selected?.vin || 'Vehicle'}
        subtitle={selected ? getStateMeta(selected.state).label : undefined}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="cluster-eyebrow">Speed</dt>
                <dd className="num">{selected.speed != null ? `${Math.round(selected.speed)} km/h` : '—'}</dd>
              </div>
              <div>
                <dt className="cluster-eyebrow">Ignition</dt>
                <dd>{selected.ignition ? 'On' : 'Off'}</dd>
              </div>
              <div>
                <dt className="cluster-eyebrow">Fuel</dt>
                <dd className="num">{selected.primaryFuelLevel != null ? `${selected.primaryFuelLevel} L` : '—'}</dd>
              </div>
              <div>
                <dt className="cluster-eyebrow">Last report</dt>
                <dd className="text-xs">{formatIST(selected.eventDateTime)}</dd>
              </div>
            </dl>

            {selected.isStale && (
              <p
                className="rounded-lg px-3 py-2 text-xs"
                style={{ background: 'color-mix(in srgb, var(--caution) 12%, transparent)', color: 'var(--caution)' }}
              >
                This position is stale — the vehicle has not reported recently.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="ov-btn" onClick={() => setShowTrail((t) => !t)}>
                {trailLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                {showTrail ? 'Hide trail' : 'Show trail'}
              </button>
              {selected.latitude != null && (
                <a
                  className="ov-btn"
                  href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Maps
                </a>
              )}
            </div>

            <div className="flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
              <Link className="flex items-center gap-1.5 text-xs" to={`/vehicles/${encodeURIComponent(selected.registrationNumber || '')}`}>
                Vehicle 360 <ArrowRight size={12} />
              </Link>
              <Link className="flex items-center gap-1.5 text-xs" to="/fleet/fuel?tab=logs&view=mileage">
                Fuel logs <ArrowRight size={12} />
              </Link>
              <Link className="flex items-center gap-1.5 text-xs" to="/fleet/trips?tab=journeys">
                Trips <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
};

export default LiveConsole;
