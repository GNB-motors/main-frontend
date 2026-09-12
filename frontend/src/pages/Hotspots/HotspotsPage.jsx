import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF, CircleF } from '@react-google-maps/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  ShieldAlert,
  BellRing,
  EyeOff,
  Eye,
  ShieldCheck,
  Globe,
  Truck,
  MapPin,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useConfirm } from '../../components/ui/confirmContext';
import {
  listHotspots,
  dismissHotspot,
  activateHotspot,
  provenanceOf,
} from '../../services/HotspotService';
import { formatNum } from '../../utils/formatters';
import { INDIA_CENTER } from '../LiveTracking/liveTracking.shared.js';
import './Hotspots.css';

dayjs.extend(relativeTime);

const PROVENANCE_META = {
  'own-learned': { label: 'Learned from your fleet', color: '#D98E13', text: '#1F2937' },
  network: { label: 'Learned across network', color: '#2563EB', text: '#FFFFFF' },
  'own-manual': { label: 'Added manually', color: '#64748B', text: '#FFFFFF' },
};

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 215px)',
  minHeight: '440px',
  maxHeight: '620px',
};

const formatLastIncident = (date) => (date ? dayjs(date).fromNow() : 'No recent incidents');

export default function HotspotsPage() {
  const confirm = useConfirm();
  const [hotspots, setHotspots] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const { isLoaded: mapLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const load = useCallback(async (signal) => {
    setError(null);
    try {
      const rows = await listHotspots({ signal });
      setHotspots(Array.isArray(rows) ? rows : []);
    } catch (err) {
      if (err?.code === 'ERR_CANCELED') return;
      setError(err?.userMessage || err?.message || 'Failed to load hotspots');
      setHotspots([]);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const active = useMemo(() => (hotspots || []).filter((h) => h.active !== false), [hotspots]);
  const dismissed = useMemo(() => (hotspots || []).filter((h) => h.active === false), [hotspots]);

  const networkCount = useMemo(
    () => (hotspots || []).filter((h) => provenanceOf(h) === 'network').length,
    [hotspots],
  );

  const defaultCenter = useMemo(() => {
    const first = active[0];
    return first && Number.isFinite(first.centerLat) && Number.isFinite(first.centerLng)
      ? { lat: first.centerLat, lng: first.centerLng }
      : INDIA_CENTER;
  }, [active]);

  const toggleActive = async (hotspot) => {
    const dismissing = hotspot.active !== false;
    const ok = await confirm({
      title: dismissing ? `Dismiss "${hotspot.name}"?` : `Restore "${hotspot.name}"?`,
      body: dismissing
        ? 'It will be hidden from the active map and trucks stopping there will pause raising theft alerts.'
        : 'It will return to the active map and the automated watch will resume alerting.',
      confirmLabel: dismissing ? 'Dismiss hotspot' : 'Restore hotspot',
      danger: dismissing,
    });
    if (!ok) return;
    setBusyId(hotspot._id);
    try {
      if (dismissing) await dismissHotspot(hotspot._id);
      else await activateHotspot(hotspot._id);
      toast.success(dismissing ? 'Hotspot dismissed' : 'Hotspot restored');
      await load();
    } catch (err) {
      toast.error(err?.userMessage || err?.message || 'Failed to update hotspot');
    } finally {
      setBusyId(null);
    }
  };

  const selectedHotspot = useMemo(
    () => active.find((h) => h._id === selectedId) || null,
    [active, selectedId],
  );

  return (
    <div className="pshell min-h-screen">
      {/* Compact Top Header */}
      <div className="hs-top-header">
        <div className="hs-title-group">
          <div className="hs-title-row">
            <h1 className="hs-title">Theft Hotspots</h1>
            <span className="num inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">
              {active.length} active zones
            </span>
          </div>
          <p className="hs-subtitle">
            Fuel theft & siphoning danger zones — learned automatically from fleet telemetry and
            network clusters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="ov-btn" onClick={() => load()} title="Refresh hotspots">
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <Link to="/fleet-alerts" className="ov-btn">
            <BellRing size={13} />
            <span>Fleet Alerts</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="font-semibold text-rose-700 hover:underline text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Persistent Framed Google Map */}
      <div className="hs-map-card">
        <div className="hs-map-head">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-amber-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Theft & Siphoning Risk Geospatial Watch
            </span>
          </div>

          {/* Enclosed KPI Rail */}
          <div className="hs-kpi-strip">
            {/* 1. Active Hotspots */}
            <div className="hs-kpi-pill">
              <span className="hs-kpi-pill-icon bg-amber-50 text-amber-600 border border-amber-200">
                <ShieldAlert size={12} />
              </span>
              <div className="hs-kpi-pill-meta">
                <span className="hs-kpi-pill-label">Active</span>
                <span className="hs-kpi-pill-value">{formatNum(active.length)}</span>
              </div>
            </div>

            {/* 2. Network Intelligence */}
            <div className="hs-kpi-pill">
              <span className="hs-kpi-pill-icon bg-blue-50 text-blue-600 border border-blue-200">
                <Globe size={12} />
              </span>
              <div className="hs-kpi-pill-meta">
                <span className="hs-kpi-pill-label">Network</span>
                <span className="hs-kpi-pill-value">{formatNum(networkCount)}</span>
              </div>
            </div>

            {/* 3. Fleet Monitored */}
            <div className="hs-kpi-pill">
              <span className="hs-kpi-pill-icon bg-emerald-50 text-emerald-600 border border-emerald-200">
                <ShieldCheck size={12} />
              </span>
              <div className="hs-kpi-pill-meta">
                <span className="hs-kpi-pill-label">Protection</span>
                <span className="hs-kpi-pill-value text-emerald-700">Active</span>
              </div>
            </div>

            {/* 4. Dismissed Zones */}
            <div className="hs-kpi-pill">
              <span className="hs-kpi-pill-icon bg-slate-100 text-slate-600 border border-slate-200">
                <EyeOff size={12} />
              </span>
              <div className="hs-kpi-pill-meta">
                <span className="hs-kpi-pill-label">Dismissed</span>
                <span className="hs-kpi-pill-value">{formatNum(dismissed.length)}</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="hs-legend-group">
            {Object.entries(PROVENANCE_META).map(([key, meta]) => (
              <span key={key} className="hs-legend-pill">
                <span className="hs-legend-dot" style={{ background: meta.color }} />
                <span>{meta.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Ambient status overlay when zero hotspots */}
        {active.length === 0 && (
          <div className="hs-ambient-badge">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Corridors Clear · 0 Theft Clusters Detected</span>
          </div>
        )}

        {/* Google Map */}
        {mapLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={active.length > 0 ? 8 : 5}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {active.map((h) => {
              const meta = PROVENANCE_META[provenanceOf(h)] || PROVENANCE_META['own-learned'];
              return (
                <React.Fragment key={h._id}>
                  <MarkerF
                    position={{ lat: h.centerLat, lng: h.centerLng }}
                    onClick={() => setSelectedId(h._id)}
                  />
                  <CircleF
                    center={{ lat: h.centerLat, lng: h.centerLng }}
                    radius={h.radiusMeters || 500}
                    options={{
                      fillColor: meta.color,
                      fillOpacity: 0.2,
                      strokeColor: meta.color,
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                    }}
                  />
                </React.Fragment>
              );
            })}

            {selectedHotspot && (
              <InfoWindowF
                position={{ lat: selectedHotspot.centerLat, lng: selectedHotspot.centerLng }}
                onCloseClick={() => setSelectedId(null)}
              >
                <div className="p-2 max-w-xs">
                  <h4 className="font-bold text-slate-900 text-sm">{selectedHotspot.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Radius: {selectedHotspot.radiusMeters || 500}m
                  </p>
                  <p className="text-xs text-slate-500">
                    Last incident: {formatLastIncident(selectedHotspot.lastIncidentAt)}
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-rose-600 hover:underline"
                    onClick={() => toggleActive(selectedHotspot)}
                  >
                    Dismiss hotspot
                  </button>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          <div className="h-[520px] flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
            Loading Google Map layers…
          </div>
        )}
      </div>

      {/* Hotspots Breakdown List / Table */}
      {active.length > 0 && (
        <div className="oa-table-wrapper mb-6">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Active Monitored Risk Zones</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Trucks lingering in these zones automatically generate high-priority fuel risk alerts.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="oa-table">
              <thead>
                <tr>
                  <th>Zone Name</th>
                  <th>Source Provenance</th>
                  <th style={{ textAlign: 'right' }}>Radius</th>
                  <th>Last Incident</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {active.map((h) => {
                  const prov = provenanceOf(h);
                  const meta = PROVENANCE_META[prov] || PROVENANCE_META['own-learned'];
                  return (
                    <tr key={h._id}>
                      <td className="font-semibold text-slate-900">
                        {h.name || 'Unnamed Hotspot'}
                      </td>
                      <td>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: `${meta.color}18`, color: meta.color }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: meta.color }}
                          />
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="num font-mono text-slate-700">
                        {h.radiusMeters || 500}m
                      </td>
                      <td className="text-xs text-slate-600">
                        {formatLastIncident(h.lastIncidentAt)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="oa-ack-action"
                          disabled={busyId === h._id}
                          onClick={() => toggleActive(h)}
                        >
                          <EyeOff size={13} />
                          <span>Dismiss</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dismissed Zones Section */}
      {dismissed.length > 0 && (
        <div className="oa-table-wrapper">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-700">
              Dismissed Hotspots ({dismissed.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Muted hotspots that no longer generate proximity stop alerts.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="oa-table">
              <thead>
                <tr>
                  <th>Zone Name</th>
                  <th>Source Provenance</th>
                  <th style={{ textAlign: 'right' }}>Radius</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dismissed.map((h) => (
                  <tr key={h._id} className="opacity-75">
                    <td className="font-medium text-slate-700">{h.name || 'Unnamed Hotspot'}</td>
                    <td>
                      <span className="text-xs text-slate-500">Dismissed</span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="num font-mono text-slate-500">
                      {h.radiusMeters || 500}m
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="oa-ack-action"
                        disabled={busyId === h._id}
                        onClick={() => toggleActive(h)}
                      >
                        <Eye size={13} />
                        <span>Restore</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
