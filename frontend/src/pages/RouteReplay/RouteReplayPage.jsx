import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, useLoadScript, MarkerF, PolylineF } from '@react-google-maps/api';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Route as RouteIcon,
  Gauge,
  Clock,
  Zap,
  Truck,
  Calendar,
  Layers,
  Compass,
} from 'lucide-react';
import dayjs from 'dayjs';
import { LiveTrackingService } from '../LiveTracking/LiveTrackingService.jsx';
import { INDIA_CENTER } from '../LiveTracking/liveTracking.shared.js';
import useApi from '../../hooks/useApi';
import apiClient from '../../utils/axiosConfig';
import {
  toFrames,
  replayStats,
  positionAt,
  toLatLngPath,
  toLatLngSegments,
  applyRoadDistance,
} from './routeReplay.js';
import RoadService from '../../services/RoadService';
import RoadTrailLayer from '../../components/map/RoadTrailLayer';
import RoadTrailLegend from '../../components/map/RoadTrailLegend';
import {
  toLayers,
  clipLayersAt,
  positionAt as roadPositionAt,
  summaryOf,
} from '../../lib/roadTrail';
import Truck3DErrorBoundary from './truck3d/Truck3DErrorBoundary.jsx';
import { isWebGLAvailable } from './truck3d/truck3dMaths.js';
import { formatNum } from '../../utils/formatters';
import './RouteReplay.css';

const Truck3DLayer = lazy(() => import('./truck3d/Truck3DLayer.jsx'));

const MAP_STYLE = {
  width: '100%',
  height: 'calc(100vh - 215px)',
  minHeight: '440px',
  maxHeight: '620px',
};
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const SPEEDS = [1, 2, 4, 8, 16];
/**
 * Which clock decided a replayed trip's boundary. Shown because "Trip start"
 * means something different when GPS proved it than when an operator typed it
 * hours late — the map should not present both as the same fact.
 */
const SOURCE_LABEL = {
  warehouse_exit: 'GPS: left yard',
  warehouse_arrival: 'GPS: reached yard',
  telematics_window: 'measured window',
  dispatched_at: 'typed: dispatch',
  trip_closed_at: 'typed: trip close',
  unloaded_at: 'typed: unloaded',
  trip_date: 'trip date only',
  now: 'still running',
};
const BASE_PLAYBACK_MS = 60000;

const fmtKm = (v) => (v == null ? '—' : `${v.toFixed(1)} km`);
const fmtSpeed = (v) => (v == null ? '—' : `${Math.round(v)} km/h`);
const fmtDuration = (ms) => {
  if (!ms || ms <= 0) return '—';
  const mins = Math.round(ms / 60000);
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export default function RouteReplayPage({ params }) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  // `?v=` and `?trip=` arrive from a trip's "View replay" link. Seeding state
  // from them is what makes that link land on the trip instead of a blank page
  // showing an unrelated week.
  const [reg, setReg] = useState(() => params?.get('v') || '');
  const [from, setFrom] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));

  /**
   * Optional clock times for the two dates. Empty means the whole day, so
   * picking dates alone still works exactly as before — these only narrow it.
   * A vehicle can cover three states in one day; a day-resolution window
   * cannot show which hours were which.
   */
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');

  /**
   * Replay one ERP trip. When set, the server resolves the window from the
   * trip itself and the date inputs below are ignored — picking a date or a
   * different vehicle clears it, because at that point the operator is asking
   * for a range, not a trip.
   */
  const [tripId, setTripId] = useState(() => params?.get('trip') || '');

  const [trail, setTrail] = useState(null);
  const [roadTrail, setRoadTrail] = useState(null); // road geometry and road distance (plan P4.10)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(4);

  // Vehicle picker
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

  const frames = useMemo(
    () => applyRoadDistance(toFrames(trail?.points), roadTrail?.timeline),
    [trail, roadTrail],
  );
  const stats = useMemo(() => replayStats(frames), [frames]);
  const path = useMemo(() => toLatLngPath(frames), [frames]);
  const head = useMemo(() => positionAt(frames, progress), [frames, progress]);
  // Split at inter-trip gaps so a break is never drawn as a continuous line.
  const fullSegments = useMemo(() => toLatLngSegments(frames), [frames]);
  const travelledSegments = useMemo(
    () => toLatLngSegments(frames, head?.index ?? 0),
    [frames, head],
  );
  // Road geometry (plan P4.10): the travelled part and the truck position follow the road, not chords.
  const roadLayers = useMemo(() => toLayers(roadTrail), [roadTrail]);
  const roadTravelled = useMemo(
    () => (head ? clipLayersAt(roadLayers, head.at) : []),
    [roadLayers, head],
  );
  const truckAt = useMemo(
    () => (head ? roadPositionAt(roadLayers, head.at) || head : null),
    [roadLayers, head],
  );

  const webglOk = useMemo(() => isWebGLAvailable(), []);
  const [truckReady, setTruckReady] = useState(false);
  const [viewMode, setViewMode] = useState(webglOk ? '3D' : '2D'); // '2D' | '3D' | '3D_FOLLOW'

  // Tilt and rotate camera based on viewMode
  useEffect(() => {
    if (!map) return;
    if (viewMode === '2D') {
      if (typeof map.setTilt === 'function') map.setTilt(0);
      if (typeof map.setHeading === 'function') map.setHeading(0);
    } else {
      if (typeof map.setTilt === 'function') map.setTilt(45);
    }
  }, [viewMode, map]);

  // In follow-cam mode, track head position and course
  useEffect(() => {
    if (viewMode === '3D_FOLLOW' && map && head) {
      map.panTo({ lat: head.lat, lng: head.lng });
      if (typeof map.setHeading === 'function' && head.heading != null) {
        map.setHeading(head.heading);
      }
    }
  }, [viewMode, map, head]);

  const loadTrail = useCallback(
    async (overrideTripId) => {
      if (!reg) return;
      // `overrideTripId` lets a click on a trip in the legend load that trip in
      // the same pass, without waiting a render for the state to settle.
      const wantTrip = overrideTripId === undefined ? tripId : overrideTripId;
      setIsLoading(true);
      setError(null);
      setPlaying(false);
      setProgress(0);
      try {
        // from/to are always sent: the server ignores them when the trip
        // resolves a window, and needs them when it cannot (a trip with no
        // anchors and no stamps, or one this org cannot see).
        const data = await LiveTrackingService.getTrail(reg, {
          from: (fromTime
            ? dayjs(`${from}T${fromTime}`)
            : dayjs(from).startOf('day')
          ).toISOString(),
          to: (toTime ? dayjs(`${to}T${toTime}`) : dayjs(to).endOf('day')).toISOString(),
          limit: 5000,
          ...(wantTrip ? { tripId: wantTrip } : {}),
        });
        setTrail(data);
        setRoadTrail(
          data?.actualFrom && data?.actualTo
            ? await RoadService.getRoadTrailIfEnabled(reg, {
                from: data.actualFrom,
                to: data.actualTo,
              })
            : null,
        );
      } catch (err) {
        setError(err.detail || 'Could not load the trail for this vehicle.');
        setTrail(null);
        setRoadTrail(null);
      } finally {
        setIsLoading(false);
      }
    },
    [reg, from, to, fromTime, toTime, tripId],
  );

  // Arriving from a trip link should just show the trip — one shot, so a later
  // manual Load never re-fires it.
  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current || !reg) return;
    bootstrapped.current = true;
    loadTrail();
  }, [reg, loadTrail]);

  /** Switching vehicle or date range means "range mode" — drop the trip lock. */
  const clearTrip = useCallback(() => setTripId(''), []);

  // Fit the map to the drawn path whenever a new trail arrives
  useEffect(() => {
    if (!mapRef.current || !window.google || path.length < 2) return;
    const bounds = new window.google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 48);
  }, [path]);

  // Playback clock
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
    if (progress >= 1) setProgress(0);
    setPlaying((p) => !p);
  };

  const truckIcon = useMemo(() => {
    if (!isLoaded || !window.google) return undefined;
    return {
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: '#0284c7',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      rotation: head?.heading || 0,
    };
  }, [isLoaded, head]);

  const atTime = head ? dayjs(head.at).format('DD MMM YYYY, hh:mm A') : '—';

  /**
   * What the two end markers actually mean for the trail currently loaded.
   *
   * A range replay has no trip boundaries to show: its edges are wherever the
   * requested window happened to cut the position stream. Saying "trip start"
   * there invented a fact, and it was wrong most of the time — the truck was
   * mid-journey at both ends.
   */
  const edgeLabels = useMemo(() => {
    const w = trail?.tripWindow;
    if (w) {
      const startWhy = SOURCE_LABEL[w.startSource] || w.startSource || 'unknown source';
      const endWhy = SOURCE_LABEL[w.endSource] || w.endSource || 'unknown source';
      return {
        isTrip: true,
        start: `Trip start${w.tripNumber ? ` · ${w.tripNumber}` : ''} — ${startWhy}`,
        end: `Trip end${w.tripNumber ? ` · ${w.tripNumber}` : ''} — ${endWhy}`,
      };
    }
    return {
      isTrip: false,
      start: 'First GPS fix in this window — not a trip start',
      end: 'Last GPS fix in this window — not a trip end',
    };
  }, [trail]);

  /** Last N hours, to the minute — the "what happened this shift" question. */
  const applyHourPreset = (hours) => {
    clearTrip();
    const end = dayjs();
    const start = end.subtract(hours, 'hour');
    setFrom(start.format('YYYY-MM-DD'));
    setFromTime(start.format('HH:mm'));
    setTo(end.format('YYYY-MM-DD'));
    setToTime(end.format('HH:mm'));
  };

  const applyPreset = (daysAgo) => {
    clearTrip();
    // A day preset means whole days; drop any hour narrowing left behind.
    setFromTime('');
    setToTime('');
    if (daysAgo === 0) {
      setFrom(dayjs().format('YYYY-MM-DD'));
      setTo(dayjs().format('YYYY-MM-DD'));
    } else if (daysAgo === 1) {
      setFrom(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
      setTo(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
    } else {
      setFrom(dayjs().subtract(daysAgo, 'day').format('YYYY-MM-DD'));
      setTo(dayjs().format('YYYY-MM-DD'));
    }
  };

  return (
    <div className="pshell min-h-screen">
      {/* Compact Top Deck: Title + Controls */}
      <div className="rr-top-deck">
        <div className="rr-brand-group">
          <h1 className="rr-brand-title">Route Replay</h1>
          {stats.pointCount > 0 && (
            <span className="num inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-bold text-blue-700">
              {formatNum(stats.pointCount)} fixes
            </span>
          )}
        </div>

        {/* Action & Filter Controls */}
        <div className="rr-controls-strip">
          {/* Vehicle Selector */}
          <div className="rr-field">
            <label htmlFor="rr-vehicle-select" className="rr-field-label">
              Vehicle
            </label>
            <select
              id="rr-vehicle-select"
              value={reg}
              onChange={(e) => {
                setReg(e.target.value);
                clearTrip();
              }}
            >
              <option value="">Select a vehicle…</option>
              {vehicles.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Presets */}
          <div className="rr-presets">
            <button type="button" className="rr-preset-btn" onClick={() => applyPreset(0)}>
              Today
            </button>
            <button type="button" className="rr-preset-btn" onClick={() => applyPreset(1)}>
              Yesterday
            </button>
            <button type="button" className="rr-preset-btn" onClick={() => applyPreset(7)}>
              7 Days
            </button>
            {/* A month covers a full warehouse-to-warehouse cycle and the trips
                that ran after it — the "where else did it go" question. */}
            <button type="button" className="rr-preset-btn" onClick={() => applyPreset(30)}>
              30 Days
            </button>
            <span className="rr-preset-sep" aria-hidden="true" />
            <button type="button" className="rr-preset-btn" onClick={() => applyHourPreset(6)}>
              6 Hrs
            </button>
            <button type="button" className="rr-preset-btn" onClick={() => applyHourPreset(12)}>
              12 Hrs
            </button>
            <button type="button" className="rr-preset-btn" onClick={() => applyHourPreset(24)}>
              24 Hrs
            </button>
          </div>

          {/* Date Range */}
          <div className="rr-field">
            <label htmlFor="rr-from-date" className="rr-field-label">
              From
            </label>
            <input
              id="rr-from-date"
              type="date"
              value={from}
              max={to}
              onChange={(e) => {
                setFrom(e.target.value);
                clearTrip();
              }}
              aria-label="From date"
            />
            <input
              className="rr-time-input"
              type="time"
              value={fromTime}
              onChange={(e) => {
                setFromTime(e.target.value);
                clearTrip();
              }}
              aria-label="From time (optional, defaults to start of day)"
              title="Optional — leave blank for the start of the day"
            />
          </div>

          <div className="rr-field">
            <label htmlFor="rr-to-date" className="rr-field-label">
              To
            </label>
            <input
              id="rr-to-date"
              type="date"
              value={to}
              min={from}
              onChange={(e) => {
                setTo(e.target.value);
                clearTrip();
              }}
              aria-label="To date"
            />
            <input
              className="rr-time-input"
              type="time"
              value={toTime}
              onChange={(e) => {
                setToTime(e.target.value);
                clearTrip();
              }}
              aria-label="To time (optional, defaults to end of day)"
              title="Optional — leave blank for the end of the day"
            />
          </div>

          {/* Load Action */}
          <button
            type="button"
            className="rr-load-btn"
            onClick={loadTrail}
            disabled={!reg || isLoading}
          >
            <RouteIcon size={15} />
            <span>{isLoading ? 'Loading…' : 'Load Replay'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">
          <AlertTriangle size={15} className="text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Truncated Trail Warning */}
      {!error && trail?.truncated && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
          <span>
            This window has {formatNum(trail.totalCount)} GPS fixes — showing only the newest{' '}
            {formatNum(trail.points?.length || 0)}, covering{' '}
            {dayjs(trail.actualFrom).format('DD MMM, hh:mm A')} →{' '}
            {dayjs(trail.actualTo).format('DD MMM, hh:mm A')}. Narrow the date range to see an
            earlier part of the trail.
          </span>
        </div>
      )}

      {/* What the loaded window actually covers, and — in range mode — what the
          end markers do NOT mean. Shown for every loaded trail, because the
          page's old habit was to present a window edge as a trip boundary. */}
      {!error && trail?.points?.length > 0 && (
        <div className="rr-window-note">
          <Clock size={13} />
          <span>
            {dayjs(trail.actualFrom).format('DD MMM, hh:mm A')} →{' '}
            {dayjs(trail.actualTo).format('DD MMM, hh:mm A')}
          </span>
          <span className="rr-window-note-sep">·</span>
          <span className={trail.tripWindow ? 'rr-window-note-trip' : 'rr-window-note-range'}>
            {trail.tripWindow
              ? 'S and E are this trip’s own boundaries'
              : 'S and E are only the first and last fix in this window — not a trip start or end'}
          </span>
        </div>
      )}

      {/* Trips in this trail — the legend, and the way into a single trip.
          Sourced from TripTelematics, so a stretch is named by the same window
          the trip's own kilometres were measured over. */}
      {!error && (trail?.trips?.length > 0 || trail?.tripWindow) && (
        <div className="rr-trip-legend">
          <div className="rr-trip-legend-head">
            <RouteIcon size={14} />
            <span>
              {trail.tripWindow
                ? `Replaying trip ${trail.tripWindow.tripNumber || ''}`.trim()
                : `${formatNum(trail.trips.length)} trip${trail.trips.length === 1 ? '' : 's'} in this window`}
            </span>
            {trail.tripWindow && (
              <span className="rr-trip-provenance">
                {SOURCE_LABEL[trail.tripWindow.startSource] || trail.tripWindow.startSource || '—'}
                {' → '}
                {SOURCE_LABEL[trail.tripWindow.endSource] || trail.tripWindow.endSource || '—'}
              </span>
            )}
            {tripId && (
              <button
                type="button"
                className="rr-trip-clear"
                onClick={() => {
                  setTripId('');
                  loadTrail('');
                }}
              >
                Show full range
              </button>
            )}
          </div>

          {trail.trips?.length > 0 && (
            <div className="rr-trip-chips">
              {trail.trips.map((t) => (
                <button
                  key={t.tripId || `${t.startTime}`}
                  type="button"
                  className={`rr-trip-chip${t.tripId === tripId ? ' is-active' : ''}`}
                  onClick={() => {
                    if (!t.tripId) return;
                    setTripId(t.tripId);
                    loadTrail(t.tripId);
                  }}
                  title={`${dayjs(t.startTime).format('DD MMM, hh:mm A')} → ${
                    t.endTime ? dayjs(t.endTime).format('DD MMM, hh:mm A') : 'running'
                  }`}
                >
                  <span className="rr-trip-chip-no">{t.tripNumber || 'Untitled trip'}</span>
                  {(t.fromLocation || t.toLocation) && (
                    <span className="rr-trip-chip-route">
                      {t.fromLocation || '—'} → {t.toLocation || '—'}
                    </span>
                  )}
                  {!t.endTime && <span className="rr-trip-chip-live">running</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty Result Notification */}
      {!error && trail && frames.length < 2 && (
        <div className="mb-3 p-4 rounded-xl border border-dashed border-slate-300 bg-white text-center flex items-center justify-center gap-3">
          <RouteIcon size={20} className="text-slate-400" />
          <p className="font-semibold text-slate-700 text-xs">
            No GPS trail found for {reg} between {dayjs(from).format('DD MMM')} and{' '}
            {dayjs(to).format('DD MMM')}. Try a wider date range.
          </p>
        </div>
      )}

      {/* Full-Width Horizontal Map Card with Enclosed KPI Rail */}
      <div className="rr-map-card">
        <div className="rr-map-head">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {reg ? `Trail: ${reg}` : 'Replay Canvas'}
            </span>
            {reg && <span className="reg-plate text-xs font-mono font-bold">{reg}</span>}
            {stats.pointCount > 0 && (
              <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                {dayjs(from).format('DD MMM')} → {dayjs(to).format('DD MMM YYYY')}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 ml-2">
              <Compass size={12} className="text-blue-600" />
              <span>{webglOk ? '3D' : '2D'}</span>
            </span>
          </div>

          {/* Enclosed Telemetry KPI Strip */}
          <div className="rr-kpi-strip">
            {/* 1. Ground Covered */}
            <div className="rr-kpi-pill">
              <span className="rr-kpi-pill-icon bg-sky-50 text-sky-600 border border-sky-200">
                <RouteIcon size={12} />
              </span>
              <div className="rr-kpi-pill-meta">
                <span className="rr-kpi-pill-label">
                  {frames[0]?.distanceSource === 'road'
                    ? 'Distance on roads'
                    : 'Distance (straight-line)'}
                </span>
                <span className="rr-kpi-pill-value">
                  {stats.distanceKm != null ? fmtKm(stats.distanceKm) : '0.0 km'}
                </span>
              </div>
            </div>

            {/* 2. Duration */}
            <div className="rr-kpi-pill">
              <span className="rr-kpi-pill-icon bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Clock size={12} />
              </span>
              <div className="rr-kpi-pill-meta">
                <span className="rr-kpi-pill-label">Duration</span>
                <span className="rr-kpi-pill-value">
                  {stats.durationMs > 0 ? fmtDuration(stats.durationMs) : '0m'}
                </span>
              </div>
            </div>

            {/* 3. Average Speed */}
            <div className="rr-kpi-pill">
              <span className="rr-kpi-pill-icon bg-amber-50 text-amber-600 border border-amber-200">
                <Gauge size={12} />
              </span>
              <div className="rr-kpi-pill-meta">
                <span className="rr-kpi-pill-label">Avg Speed</span>
                <span className="rr-kpi-pill-value">
                  {stats.avgSpeedKmph > 0 ? fmtSpeed(stats.avgSpeedKmph) : '0 km/h'}
                </span>
              </div>
            </div>

            {/* 4. Peak Speed */}
            <div className="rr-kpi-pill">
              <span className="rr-kpi-pill-icon bg-rose-50 text-rose-600 border border-rose-200">
                <Zap size={12} />
              </span>
              <div className="rr-kpi-pill-meta">
                <span className="rr-kpi-pill-label">Peak Speed</span>
                <span
                  className="rr-kpi-pill-value"
                  style={{ color: stats.maxSpeedKmph > 65 ? '#e11d48' : '#0f172a' }}
                >
                  {stats.maxSpeedKmph > 0 ? fmtSpeed(stats.maxSpeedKmph) : '0 km/h'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Perspective Switcher */}
        <div className="flex items-center justify-between pb-2">
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Layers size={14} className="text-slate-500" />
            <span>Replay Perspective</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('2D')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewMode === '2D'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              2D Classic
            </button>
            <button
              type="button"
              disabled={!webglOk}
              onClick={() => setViewMode('3D')}
              title={!webglOk ? 'WebGL not supported on this device' : '3D Isometric Truck View'}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewMode === '3D'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              } ${!webglOk ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              3D Isometric
            </button>
            <button
              type="button"
              disabled={!webglOk}
              onClick={() => setViewMode('3D_FOLLOW')}
              title={
                !webglOk
                  ? 'WebGL not supported on this device'
                  : 'Follow-Cam with dynamic heading rotation'
              }
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewMode === '3D_FOLLOW'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              } ${!webglOk ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              3D Follow-Cam
            </button>
          </div>
        </div>

        {/* Google Map Area */}
        <div className="relative">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={MAP_STYLE}
              center={path[0] || INDIA_CENTER}
              zoom={path.length ? 9 : 5}
              onLoad={(m) => {
                mapRef.current = m;
                setMap(m);
              }}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
              }}
            >
              {path.length > 1 && (
                <>
                  {roadLayers.length > 0 ? (
                    <>
                      <RoadTrailLayer layers={roadLayers} color="#94a3b8" fleetColor="#c4b5fd" />
                      <RoadTrailLayer layers={roadTravelled} color="#0284c7" />
                    </>
                  ) : (
                    <>
                      {/* Full path, split at inter-trip gaps */}
                      {fullSegments.map(
                        (seg, idx) =>
                          seg.length > 1 && (
                            <PolylineF
                              key={`full-${idx}`}
                              path={seg}
                              options={{
                                strokeColor: '#94a3b8',
                                strokeOpacity: 0.8,
                                strokeWeight: 4,
                              }}
                            />
                          ),
                      )}
                      {/* Travelled segment, same split */}
                      {travelledSegments.map(
                        (seg, idx) =>
                          seg.length > 1 && (
                            <PolylineF
                              key={`travelled-${idx}`}
                              path={seg}
                              options={{
                                strokeColor: '#0284c7',
                                strokeOpacity: 1,
                                strokeWeight: 5,
                              }}
                            />
                          ),
                      )}
                    </>
                  )}
                  {/* In range mode these are the first and last FIX in the
                      window, nothing more — calling them the trip's start and
                      end is the old lie this page used to tell. Only a replay
                      pinned to one trip can claim a boundary, and then the
                      title says which clock proved it. */}
                  <MarkerF
                    position={path[0]}
                    title={edgeLabels.start}
                    label={{
                      text: edgeLabels.isTrip ? 'S' : '1',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  />
                  <MarkerF
                    position={path[path.length - 1]}
                    title={edgeLabels.end}
                    label={{
                      text: edgeLabels.isTrip ? 'E' : 'N',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  />
                </>
              )}
              {head && (viewMode === '2D' || !truckReady) && (
                <MarkerF
                  position={{ lat: truckAt.lat, lng: truckAt.lng }}
                  icon={truckIcon}
                  zIndex={99}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="h-[520px] flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
              Loading Google Map layers…
            </div>
          )}

          {/* 3D WebGL Truck Layer */}
          {webglOk && viewMode !== '2D' && map && head && (
            <Truck3DErrorBoundary>
              <Suspense fallback={null}>
                <Truck3DLayer map={map} head={head} onReady={() => setTruckReady(true)} />
              </Suspense>
            </Truck3DErrorBoundary>
          )}

          {/* 3D Attribution Badge */}
          {viewMode !== '2D' && (
            <div className="absolute bottom-3 right-3 z-10 bg-black/60 text-white/80 text-[10px] px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none">
              3D Asset: Indian Truck by AFJAL ANSARI (CC BY 4.0)
            </div>
          )}
        </div>

        {roadLayers.length > 0 && (
          <RoadTrailLegend
            layers={roadLayers}
            calibrated={roadTrail?.calibrated}
            summary={summaryOf(roadTrail)}
            className="px-3 py-2"
          />
        )}

        {/* Playback Control Deck */}
        {frames.length >= 2 && (
          <div className="rr-playback-bar">
            <button
              type="button"
              className="rr-play-btn"
              onClick={togglePlay}
              title={playing ? 'Pause replay' : 'Play replay'}
            >
              {playing ? <Pause size={15} /> : <Play size={15} />}
              <span>{playing ? 'Pause' : 'Play'}</span>
            </button>

            <button
              type="button"
              className="ov-btn"
              onClick={() => {
                setPlaying(false);
                setProgress(0);
              }}
              title="Restart from beginning"
            >
              <RotateCcw size={14} />
              <span>Restart</span>
            </button>

            {/* Scrubber Range */}
            <div className="rr-scrub-container">
              <input
                className="rr-scrubber"
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
            </div>

            {/* Playback Speed Toggles */}
            <div className="rr-rate-group">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`rr-rate-btn ${rate === s ? 'rr-rate-btn--active' : ''}`}
                  onClick={() => setRate(s)}
                >
                  {s}×
                </button>
              ))}
            </div>

            {/* Telemetry Readout Pill */}
            <div className="rr-readout-pill">
              <span className="font-bold text-slate-900">{atTime}</span>
              <span>·</span>
              <span className="flex items-center gap-1 font-semibold text-sky-700">
                <Gauge size={13} /> {fmtSpeed(head?.groundSpeedKmph)}
              </span>
              <span>·</span>
              <span className="font-semibold text-slate-700">
                {fmtKm(head?.cumulativeKm)} travelled
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
