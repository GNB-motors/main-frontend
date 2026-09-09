import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, useLoadScript, MarkerF, PolylineF } from '@react-google-maps/api';
import { Play, Pause, RotateCcw, AlertTriangle, Route as RouteIcon, Gauge } from 'lucide-react';
import dayjs from 'dayjs';
import { LiveTrackingService } from '../LiveTracking/LiveTrackingService.jsx';
import { INDIA_CENTER } from '../LiveTracking/liveTracking.shared.js';
import PageShell from '../../components/ui/PageShell';
import useApi from '../../hooks/useApi';
import apiClient from '../../utils/axiosConfig';
import { toFrames, replayStats, positionAt, toLatLngPath } from './routeReplay.js';
import Truck3DErrorBoundary from './truck3d/Truck3DErrorBoundary.jsx';
import { isWebGLAvailable } from './truck3d/truck3dMaths.js';
import './RouteReplay.css';

const Truck3DLayer = lazy(() => import('./truck3d/Truck3DLayer.jsx'));

const MAP_STYLE = { width: '100%', height: '540px', borderRadius: '0.75rem' };
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const SPEEDS = [1, 2, 4, 8, 16];
/** Playback maps the whole trail onto a fixed wall-clock duration at 1x. */
const BASE_PLAYBACK_MS = 60000;

const fmtKm = (v) => (v == null ? '—' : `${v.toFixed(1)} km`);
const fmtSpeed = (v) => (v == null ? '—' : `${Math.round(v)} km/h`);
const fmtDuration = (ms) => {
  if (!ms || ms <= 0) return '—';
  const mins = Math.round(ms / 60000);
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

/**
 * RouteReplayPage — a playable replay of the ground a vehicle actually covered.
 *
 * The path is the breadcrumb trail from
 * GET /api/livetracking/positions/:reg/trail (append-only history), not a
 * planned route: RoutesMaster stores only a source and a destination, so there
 * is no planned geometry to draw. What is drawn here is where the truck really
 * went, which is also what makes the distance and speed figures ground truth
 * rather than estimates.
 *
 * All maths lives in routeReplay.js so it can be tested without a map.
 */
const RouteReplayPage = () => {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  const [reg, setReg] = useState('');
  const [from, setFrom] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));

  const [trail, setTrail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(4);

  // Vehicle picker — the same fleet list the rest of the app uses.
  const { data: vehiclesRes } = useApi(
    (signal) => apiClient.get('api/vehicles', { params: { limit: 200 }, signal }),
    [],
  );
  const vehicles = useMemo(() => {
    const rows = vehiclesRes?.data?.data || vehiclesRes?.data || [];
    return (Array.isArray(rows) ? rows : [])
      .map((v) => v.registrationNumber || v.vehicleNumber)
      .filter(Boolean);
  }, [vehiclesRes]);

  const frames = useMemo(() => toFrames(trail?.points), [trail]);
  const stats = useMemo(() => replayStats(frames), [frames]);
  const path = useMemo(() => toLatLngPath(frames), [frames]);
  const head = useMemo(() => positionAt(frames, progress), [frames, progress]);
  // Display-only corridor snap: same fixes, projected onto learned corridors
  // where one lies within ~150 m. Stats and playback stay on measured frames.
  const snapPath = useMemo(
    () => (trail?.snap?.path || []).map((p) => ({ lat: p.lat, lng: p.lng })),
    [trail],
  );
  const snapInfo = trail?.snap || null;

  // 3-D truck state: only attempted when WebGL exists; the 2-D heading marker
  // stays mounted until the model is actually standing on the map.
  const webglOk = useMemo(() => isWebGLAvailable(), []);
  const [truckReady, setTruckReady] = useState(false);

  const loadTrail = useCallback(async () => {
    if (!reg) return;
    setIsLoading(true);
    setError(null);
    setPlaying(false);
    setProgress(0);
    try {
      const data = await LiveTrackingService.getTrail(reg, {
        from: dayjs(from).startOf('day').toISOString(),
        to: dayjs(to).endOf('day').toISOString(),
        limit: 5000,
        snap: 'corridor',
      });
      setTrail(data);
    } catch (err) {
      setError(err.detail || 'Could not load the trail for this vehicle.');
      setTrail(null);
    } finally {
      setIsLoading(false);
    }
  }, [reg, from, to]);

  // Fit the map to the drawn path whenever a new trail arrives.
  useEffect(() => {
    if (!mapRef.current || !window.google || path.length < 2) return;
    const bounds = new window.google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 48);
  }, [path]);

  // Playback clock. Driven by rAF rather than setInterval so the marker moves
  // with the display and pauses when the tab is hidden.
  useEffect(() => {
    if (!playing || frames.length < 2) return undefined;
    let raf = 0;
    let last = performance.now();
    const step = (now) => {
      const delta = now - last;
      last = now;
      setProgress((p) => {
        const next = p + delta / (BASE_PLAYBACK_MS / rate);
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, rate, frames.length]);

  const togglePlay = () => {
    if (frames.length < 2) return;
    // Restarting from the end rewinds rather than sitting stuck at 1.
    if (progress >= 1) setProgress(0);
    setPlaying((p) => !p);
  };

  const truckIcon = useMemo(() => {
    if (!isLoaded || !window.google) return undefined;
    return {
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: '#B8460F',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      rotation: head?.heading || 0,
    };
  }, [isLoaded, head]);

  const atTime = head ? dayjs(head.at).format('DD MMM YYYY, hh:mm A') : '—';

  return (
    <PageShell
      title="Route Replay"
      subtitle="Play back the ground a vehicle actually covered — distance and speed measured from the breadcrumb trail, not from a plan"
      count={stats.pointCount || null}
      footer="3D truck: Indian Truck by AFJAL ANSARI (CC-BY)"
      filters={
        <div className="rr-filters">
          <label className="rr-field">
            <span>Vehicle</span>
            <select value={reg} onChange={(e) => setReg(e.target.value)}>
              <option value="">Select a vehicle…</option>
              {vehicles.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="rr-field">
            <span>From</span>
            <input
              type="date"
              aria-label="Replay window start date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="rr-field">
            <span>To</span>
            <input
              type="date"
              aria-label="Replay window end date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <button
            className="rr-btn rr-btn--primary"
            onClick={loadTrail}
            disabled={!reg || isLoading}
          >
            {isLoading ? 'Loading…' : 'Load replay'}
          </button>
        </div>
      }
    >
      {error && (
        <div role="alert" className="rr-alert">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {!error && trail?.truncated && (
        <div role="status" className="rr-alert">
          <AlertTriangle size={15} /> Showing the oldest {frames.length} of {trail.totalCount}{' '}
          points in this window (up to {dayjs(trail.coveredTo).format('DD MMM, hh:mm A')}) — narrow
          the dates to see the rest.
        </div>
      )}

      {!error && snapInfo && snapInfo.snappedCount > 0 && (
        <div className="rr-readout" role="note">
          <span>
            <span style={{ color: '#7c3aed' }}>- - -</span> snapped to a learned corridor (
            {snapInfo.snappedCount} of {snapInfo.path.length} fixes, display only — fixes beyond
            ~150 m of a corridor stay measured)
          </span>
        </div>
      )}

      {!error && trail && frames.length < 2 && (
        <div className="rr-empty">
          <RouteIcon size={26} />
          <p className="rr-empty-title">No trail recorded for this window</p>
          <p className="rr-empty-sub">
            {reg} reported {frames.length} usable position{frames.length === 1 ? '' : 's'} between{' '}
            {dayjs(from).format('DD MMM')} and {dayjs(to).format('DD MMM')}. Widen the dates, or
            pick a vehicle with a live device — this is what the data says, not an error.
          </p>
        </div>
      )}

      {frames.length >= 2 && (
        <>
          <div className="rr-stats">
            <div className="rr-stat">
              <span className="rr-stat-label">Ground covered</span>
              <span className="rr-stat-value num">{fmtKm(stats.distanceKm)}</span>
              <span className="rr-stat-sub">measured between fixes</span>
            </div>
            <div className="rr-stat">
              <span className="rr-stat-label">Duration</span>
              <span className="rr-stat-value num">{fmtDuration(stats.durationMs)}</span>
              <span className="rr-stat-sub">first to last fix</span>
            </div>
            <div className="rr-stat">
              <span className="rr-stat-label">Average speed</span>
              <span className="rr-stat-value num">{fmtSpeed(stats.avgSpeedKmph)}</span>
              <span className="rr-stat-sub">distance ÷ elapsed</span>
            </div>
            <div className="rr-stat">
              <span className="rr-stat-label">Peak leg speed</span>
              <span className="rr-stat-value num">{fmtSpeed(stats.maxSpeedKmph)}</span>
              <span className="rr-stat-sub">fastest single leg</span>
            </div>
          </div>

          <div className="rr-controls">
            <button className="rr-btn" onClick={togglePlay} title={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              className="rr-btn"
              onClick={() => {
                setPlaying(false);
                setProgress(0);
              }}
              title="Restart"
            >
              <RotateCcw size={15} /> Restart
            </button>
            <input
              className="rr-scrub"
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={progress}
              onChange={(e) => {
                setPlaying(false);
                setProgress(Number(e.target.value));
              }}
              aria-label="Scrub through the replay"
            />
            <label className="rr-rate">
              <span>Speed</span>
              <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>
                    {s}×
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rr-readout">
            <span>
              <strong>{atTime}</strong>
            </span>
            <span>
              <Gauge size={13} /> {fmtSpeed(head?.groundSpeedKmph)} over ground
              {head?.reportedSpeed != null && (
                <span className="rr-reported"> · device says {fmtSpeed(head.reportedSpeed)}</span>
              )}
            </span>
            <span>{fmtKm(head?.cumulativeKm)} travelled</span>
          </div>
        </>
      )}

      {isLoaded && (
        <GoogleMap
          mapContainerStyle={MAP_STYLE}
          center={path[0] || INDIA_CENTER}
          zoom={path.length ? 9 : 5}
          onLoad={(m) => {
            mapRef.current = m;
            setMap(m);
          }}
          options={{ streetViewControl: false, mapTypeControl: false }}
        >
          {/* Corridor-matched display path (dashed purple): the same observed
              fixes projected onto learned corridors where one is within
              ~150 m. Fixes beyond tolerance stay measured and draw solid
              below. Display only — never feeds the stats or playback. */}
          {snapPath.length > 1 && snapInfo?.snappedCount > 0 && (
            <PolylineF
              path={snapPath}
              options={{
                strokeColor: '#7c3aed',
                strokeOpacity: 0,
                icons: [
                  {
                    icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.85, scale: 2 },
                    offset: '0',
                    repeat: '10px',
                  },
                ],
                strokeWeight: 4,
                zIndex: 1,
              }}
            />
          )}
          {path.length > 1 && (
            <>
              {/* Full route, then the portion already played on top of it. */}
              <PolylineF
                path={path}
                options={{ strokeColor: '#94a3b8', strokeOpacity: 0.9, strokeWeight: 4 }}
              />
              <PolylineF
                path={path.slice(0, (head?.index ?? 0) + 1)}
                options={{ strokeColor: '#B8460F', strokeOpacity: 1, strokeWeight: 5 }}
              />
              <MarkerF position={path[0]} label={{ text: 'S', color: '#fff', fontSize: '11px' }} />
              <MarkerF
                position={path[path.length - 1]}
                label={{ text: 'E', color: '#fff', fontSize: '11px' }}
              />
            </>
          )}
          {head && !truckReady && (
            <MarkerF position={{ lat: head.lat, lng: head.lng }} icon={truckIcon} zIndex={99} />
          )}
        </GoogleMap>
      )}

      {webglOk && map && head && (
        <Truck3DErrorBoundary>
          <Suspense fallback={null}>
            <Truck3DLayer map={map} head={head} onReady={() => setTruckReady(true)} />
          </Suspense>
        </Truck3DErrorBoundary>
      )}
    </PageShell>
  );
};

export default RouteReplayPage;
