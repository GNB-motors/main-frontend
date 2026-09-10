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
import { toFrames, replayStats, positionAt, toLatLngPath } from './routeReplay.js';
import Truck3DErrorBoundary from './truck3d/Truck3DErrorBoundary.jsx';
import { isWebGLAvailable } from './truck3d/truck3dMaths.js';
import { formatNum } from '../../utils/formatters';
import './RouteReplay.css';

const Truck3DLayer = lazy(() => import('./truck3d/Truck3DLayer.jsx'));

const MAP_STYLE = { width: '100%', height: '520px' };
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const SPEEDS = [1, 2, 4, 8, 16];
const BASE_PLAYBACK_MS = 60000;

const fmtKm = (v) => (v == null ? '—' : `${v.toFixed(1)} km`);
const fmtSpeed = (v) => (v == null ? '—' : `${Math.round(v)} km/h`);
const fmtDuration = (ms) => {
  if (!ms || ms <= 0) return '—';
  const mins = Math.round(ms / 60000);
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export default function RouteReplayPage() {
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

  const frames = useMemo(() => toFrames(trail?.points), [trail]);
  const stats = useMemo(() => replayStats(frames), [frames]);
  const path = useMemo(() => toLatLngPath(frames), [frames]);
  const head = useMemo(() => positionAt(frames, progress), [frames, progress]);

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
      });
      setTrail(data);
    } catch (err) {
      setError(err.detail || 'Could not load the trail for this vehicle.');
      setTrail(null);
    } finally {
      setIsLoading(false);
    }
  }, [reg, from, to]);

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

  const applyPreset = (daysAgo) => {
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
      {/* Page Header */}
      <header className="pshell-head mb-6">
        <div className="pshell-head-main">
          <div className="flex items-center gap-3">
            <h1 className="pshell-title text-2xl font-bold text-slate-900 tracking-tight">
              Route Replay
            </h1>
            {stats.pointCount > 0 && (
              <span className="num inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                {formatNum(stats.pointCount)} GPS fixes
              </span>
            )}
          </div>
          <p className="pshell-subtitle text-sm text-slate-500 mt-1">
            Replay historical breadcrumb trails — distance and speeds measured directly from
            telemetry.
          </p>
        </div>
      </header>

      {/* Operations Telemetry KPI Rail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 1. Ground Covered */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Ground Covered</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-sky-600 border border-sky-200">
              <RouteIcon size={14} />
            </span>
          </div>
          <span className="ov-kpi-value text-slate-900">
            {stats.distanceKm != null ? fmtKm(stats.distanceKm) : '0.0 km'}
          </span>
          <span className="ov-kpi-sub">measured between GPS fixes</span>
        </div>

        {/* 2. Duration */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Trail Duration</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Clock size={14} />
            </span>
          </div>
          <span className="ov-kpi-value text-slate-900">
            {stats.durationMs > 0 ? fmtDuration(stats.durationMs) : '0m'}
          </span>
          <span className="ov-kpi-sub">from first to last fix</span>
        </div>

        {/* 3. Average Speed */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Average Speed</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              <Gauge size={14} />
            </span>
          </div>
          <span className="ov-kpi-value text-slate-900">
            {stats.avgSpeedKmph > 0 ? fmtSpeed(stats.avgSpeedKmph) : '0 km/h'}
          </span>
          <span className="ov-kpi-sub">distance ÷ elapsed time</span>
        </div>

        {/* 4. Peak Leg Speed */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #f43f5e' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Peak Leg Speed</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              <Zap size={14} />
            </span>
          </div>
          <span
            className="ov-kpi-value"
            style={{ color: stats.maxSpeedKmph > 65 ? '#e11d48' : '#0f172a' }}
          >
            {stats.maxSpeedKmph > 0 ? fmtSpeed(stats.maxSpeedKmph) : '0 km/h'}
          </span>
          <span className="ov-kpi-sub">fastest single telemetry fix</span>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="rr-control-panel">
        {/* Vehicle Picker */}
        <div className="rr-field">
          <label className="rr-field-label">Vehicle</label>
          <select value={reg} onChange={(e) => setReg(e.target.value)}>
            <option value="">Select a vehicle…</option>
            {vehicles.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Date Presets */}
        <div className="rr-field">
          <label className="rr-field-label">Quick Presets</label>
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
          </div>
        </div>

        {/* Date From */}
        <div className="rr-field">
          <label className="rr-field-label">From Date</label>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </div>

        {/* Date To */}
        <div className="rr-field">
          <label className="rr-field-label">To Date</label>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </div>

        {/* Load Action */}
        <button
          type="button"
          className="rr-load-btn"
          onClick={loadTrail}
          disabled={!reg || isLoading}
        >
          <RouteIcon size={16} />
          <span>{isLoading ? 'Fetching trail…' : 'Load Replay'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty Result Notification */}
      {!error && trail && frames.length < 2 && (
        <div className="mb-6 p-8 rounded-xl border border-dashed border-slate-300 bg-white text-center">
          <RouteIcon size={32} className="mx-auto text-slate-400 mb-2" />
          <p className="font-bold text-slate-900 text-sm">No GPS trail found for this window</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {reg} reported {frames.length} position fix between {dayjs(from).format('DD MMM')} and{' '}
            {dayjs(to).format('DD MMM')}. Try selecting a wider date range or a currently active
            vehicle.
          </p>
        </div>
      )}

      {/* Framed Replay Map Card */}
      <div className="rr-map-card">
        <div className="rr-map-head">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {reg ? `Trail: ${reg}` : 'Replay Canvas'}
            </span>
            {reg && <span className="reg-plate text-xs font-mono font-bold">{reg}</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {stats.pointCount > 0 && (
              <span className="font-mono">
                {dayjs(from).format('DD MMM')} → {dayjs(to).format('DD MMM YYYY')}
              </span>
            )}
            <span className="flex items-center gap-1 font-semibold text-slate-600">
              <Compass size={13} className="text-blue-600" />
              <span>{webglOk ? '3D Engine Ready' : '2D Map Engine'}</span>
            </span>
          </div>
        </div>

        {/* Google Map */}
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
                {/* Full path */}
                <PolylineF
                  path={path}
                  options={{ strokeColor: '#94a3b8', strokeOpacity: 0.8, strokeWeight: 4 }}
                />
                {/* Travelled segment */}
                <PolylineF
                  path={path.slice(0, (head?.index ?? 0) + 1)}
                  options={{ strokeColor: '#0284c7', strokeOpacity: 1, strokeWeight: 5 }}
                />
                <MarkerF
                  position={path[0]}
                  label={{ text: 'S', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                />
                <MarkerF
                  position={path[path.length - 1]}
                  label={{ text: 'E', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                />
              </>
            )}
            {head && !truckReady && (
              <MarkerF position={{ lat: head.lat, lng: head.lng }} icon={truckIcon} zIndex={99} />
            )}
          </GoogleMap>
        ) : (
          <div className="h-[520px] flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
            Loading Google Map layers…
          </div>
        )}

        {/* 3D WebGL Truck Layer */}
        {webglOk && map && head && (
          <Truck3DErrorBoundary>
            <Suspense fallback={null}>
              <Truck3DLayer map={map} head={head} onReady={() => setTruckReady(true)} />
            </Suspense>
          </Truck3DErrorBoundary>
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
