import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  CheckCircle2,
  RefreshCw,
  Truck,
  ShieldAlert,
  Wifi,
  WifiOff,
  Plus,
  Droplets,
  BellRing,
  Globe,
  Eye,
  EyeOff,
} from 'lucide-react';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF, CircleF } from '@react-google-maps/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useConfirm } from '../../components/ui/confirmContext';
import { GeofenceService } from '../../services/GeofenceService.jsx';
import { toast } from 'react-toastify';
import { formatNum, formatLitres } from '../../utils/formatters';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import { useLivePositions } from '../../hooks/useLivePositions';
import { useFullPageLayout } from '../../hooks/usePageLayout';
import { toGeofenceLiveVehicle } from './geofenceLive.shared.js';
import AddZoneDrawer from './AddZoneDrawer.jsx';
import DrainHotspotMap from '../Hotspots/DrainHotspotMap.jsx';
import '../Hotspots/Hotspots.css';
import './Geofence.css';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const IST = 'Asia/Kolkata';
const fromNow = (d) => (d ? dayjs.utc(d).tz(IST).fromNow() : '—');
const formatLastIncident = (date) =>
  date ? dayjs.utc(date).tz(IST).fromNow() : 'No recent incidents';

const MAP_CENTER = { lat: 22.5, lng: 82.0 };
const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  gestureHandling: 'greedy',
};

const FLEET_EDGE_ICONS = {
  Moving:
    'https://d1mk50hnhgdjj6.cloudfront.net/production/assets/vehicle/vehicle_images/MovingTruckV2.svg',
  Stopped:
    'https://d1mk50hnhgdjj6.cloudfront.net/production/assets/vehicle/vehicle_images/StoppedTruckV2.svg',
  Idling:
    'https://d1mk50hnhgdjj6.cloudfront.net/production/assets/vehicle/vehicle_images/IdlingTruckV2.svg',
  Offline:
    'https://d1mk50hnhgdjj6.cloudfront.net/production/assets/vehicle/vehicle_images/OfflineTruckV2.svg',
  Breakdown:
    'https://d1mk50hnhgdjj6.cloudfront.net/production/assets/vehicle/vehicle_images/StoppedTruckV2.svg',
  Faulty:
    'https://d1mk50hnhgdjj6.cloudfront.net/production/assets/vehicle/vehicle_images/OfflineTruckV2.svg',
};

const VEHICLE_STATUS_COLOR = {
  Moving: '#22c55e', // green
  Stopped: '#8b5cf6', // purple
  Idling: '#f59e0b', // yellowish-orange
  Offline: '#94a3b8', // grey
  Breakdown: '#ef4444', // red
  Faulty: '#4d7c0f', // darker green for high contrast (WCAG AA compliant)
};

const PROVENANCE_META = {
  'own-learned': { label: 'Learned from your fleet', color: '#6366F1', text: '#FFFFFF' },
  network: { label: 'Learned across network', color: '#2563EB', text: '#FFFFFF' },
  'own-manual': { label: 'Added manually', color: '#64748B', text: '#FFFFFF' },
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const GeofencePage = () => {
  useFullPageLayout();
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'drain' ? 'drain' : 'hotspots',
  );

  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotspotQuery, setHotspotQuery] = useState('');
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [busyHotspotId, setBusyHotspotId] = useState(null);
  const [showZoneDrawer, setShowZoneDrawer] = useState(false);
  const [zonePrefillLatLng, setZonePrefillLatLng] = useState(null);
  const [zonePrefillName, setZonePrefillName] = useState('');

  const handleCreateZone = (opts = {}) => {
    setZonePrefillLatLng(opts.lat && opts.lng ? { lat: opts.lat, lng: opts.lng } : null);
    setZonePrefillName(opts.name || '');
    setShowZoneDrawer(true);
  };

  // Live vehicles arrive on the shared `positions` stream; streamed rows are
  // translated into the live-locations row shape this page has always drawn.
  const fetchLiveFleet = useCallback(async () => {
    try {
      const raw = await GeofenceService.getLiveLocations();
      return (raw || [])
        .map(toGeofenceLiveVehicle)
        .filter((v) => v && Number.isFinite(v.lat) && Number.isFinite(v.lng));
    } catch {
      return [];
    }
  }, []);

  const liveEnabled = import.meta.env.VITE_GEOFENCE_FLEETEDGE_ENABLED !== 'false';
  const { positions: liveVehicles, error: liveError } = useLivePositions({
    enabled: liveEnabled,
    initialFetch: fetchLiveFleet,
    mapStreamRow: toGeofenceLiveVehicle,
    fallbackPollMs: 15000,
  });
  const liveOnline = liveEnabled && !liveError;

  const validLiveVehicles = useMemo(() => {
    return (liveVehicles || [])
      .map(toGeofenceLiveVehicle)
      .filter((v) => v && Number.isFinite(v.lat) && Number.isFinite(v.lng));
  }, [liveVehicles]);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const mapRef = useRef(null);

  const { isLoaded: mapLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const hotspotsData = await GeofenceService.getHotspots();
      setHotspots(Array.isArray(hotspotsData) ? hotspotsData : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeHotspots = useMemo(
    () => (hotspots || []).filter((h) => h.active !== false),
    [hotspots],
  );
  const dismissedHotspots = useMemo(
    () => (hotspots || []).filter((h) => h.active === false),
    [hotspots],
  );
  const networkHotspotCount = useMemo(
    () => (hotspots || []).filter((h) => GeofenceService.provenanceOf(h) === 'network').length,
    [hotspots],
  );

  const toggleActiveHotspot = async (hotspot) => {
    const dismissing = hotspot.active !== false;
    const ok = await confirm({
      title: dismissing ? `Dismiss "${hotspot.name}"?` : `Restore "${hotspot.name}"?`,
      body: dismissing
        ? 'It will be hidden from the active watch map and trucks stopping there will pause raising fuel-risk alerts.'
        : 'It will return to the active watch map and automated fuel drain monitoring will resume.',
      confirmLabel: dismissing ? 'Dismiss hotspot' : 'Restore hotspot',
      danger: dismissing,
    });
    if (!ok) return;
    setBusyHotspotId(hotspot._id);
    try {
      if (dismissing) await GeofenceService.dismissHotspot(hotspot._id);
      else await GeofenceService.activateHotspot(hotspot._id);
      toast.success(dismissing ? 'Hotspot dismissed' : 'Hotspot restored');
      await fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to update hotspot');
    } finally {
      setBusyHotspotId(null);
    }
  };

  // Fit bounds when data changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    if (activeHotspots.length === 0 && validLiveVehicles.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    activeHotspots.forEach((h) => {
      const lat = h.centerLat ?? h.lat;
      const lng = h.centerLng ?? h.lng;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        bounds.extend({ lat, lng });
        hasPoints = true;
      }
    });

    validLiveVehicles.forEach((v) => {
      if (Number.isFinite(v.lat) && Number.isFinite(v.lng)) {
        bounds.extend({ lat: v.lat, lng: v.lng });
        hasPoints = true;
      }
    });

    if (hasPoints) {
      mapRef.current.fitBounds(bounds);
      const listener = window.google.maps.event.addListener(mapRef.current, 'idle', () => {
        if (mapRef.current.getZoom() > 14) mapRef.current.setZoom(14);
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [activeHotspots, validLiveVehicles, mapLoaded]);

  const hotspotNeedle = hotspotQuery.trim().toLowerCase();
  const filteredActiveHotspots = hotspotNeedle
    ? activeHotspots.filter((h) =>
        [h.name, h.source, GeofenceService.provenanceOf(h)].some((f) =>
          String(f ?? '')
            .toLowerCase()
            .includes(hotspotNeedle),
        ),
      )
    : activeHotspots;

  const hotspotsWithPos = useMemo(() => {
    return activeHotspots
      .map((h) => {
        const lat = h.centerLat ?? h.lat;
        const lng = h.centerLng ?? h.lng;
        const prov = GeofenceService.provenanceOf(h);
        const meta = PROVENANCE_META[prov] || PROVENANCE_META['own-learned'];
        return {
          ...h,
          lat,
          lng,
          position: { lat, lng },
          radius: h.radiusMeters || h.radiusM || 500,
          meta,
        };
      })
      .filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lng));
  }, [activeHotspots]);

  const vehicleIcons = useMemo(() => {
    if (typeof window === 'undefined' || !window.google) return {};
    const size = new window.google.maps.Size(32, 54);
    const anchor = new window.google.maps.Point(16, 27);
    const out = {};
    for (const [st, url] of Object.entries(FLEET_EDGE_ICONS)) {
      out[st] = { url, scaledSize: size, anchor };
    }
    return out;
  }, [mapLoaded]);

  return (
    <PageShell
      className="gf-page"
      title="Fuel Risk Hotspots"
      subtitle="Siphoning hotspots, the fuel drain map and live fleet positions"
      count={activeTab === 'hotspots' ? activeHotspots.length : null}
      actions={
        <>
          <button className="gf-btn gf-btn-primary" onClick={() => handleCreateZone()}>
            <Plus size={14} /> Draw Zone
          </button>
          <Link to="/geofence/zones" className="gf-btn gf-btn-ghost">
            <MapPin size={14} /> Zones &amp; Alerts
          </Link>
          <Link to="/fleet-alerts" className="gf-btn gf-btn-ghost">
            <BellRing size={14} /> Fleet Alerts
          </Link>
          {import.meta.env.VITE_GEOFENCE_FLEETEDGE_ENABLED !== 'false' ? (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '12px',
                background: liveOnline ? '#ecfdf5' : '#f1f5f9',
                color: liveOnline ? '#059669' : '#64748b',
                fontWeight: 500,
              }}
            >
              {liveOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {liveOnline ? 'Live' : 'Offline'}
            </span>
          ) : (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '12px',
                background: '#fef2f2',
                color: '#ef4444',
                fontWeight: 500,
              }}
            >
              <WifiOff size={12} /> Live tracking disabled
            </span>
          )}
          <button className="gf-btn gf-btn-ghost" onClick={fetchData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'gf-spin' : ''} />
            Refresh
          </button>
        </>
      }
      filters={
        activeTab === 'hotspots' ? (
          <FilterBar
            searchValue={hotspotQuery}
            onSearchChange={(v) => setHotspotQuery(v)}
            searchPlaceholder="Search hotspot name or source…"
            activeCount={hotspotNeedle ? 1 : 0}
            onClear={() => setHotspotQuery('')}
          />
        ) : null
      }
      footer={
        activeTab === 'hotspots'
          ? `${filteredActiveHotspots.length} active fuel risk hotspots monitored`
          : null
      }
    >
      {/* View Switcher: Hotspots vs Fuel Drain Map */}
      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('hotspots')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
            activeTab === 'hotspots'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <MapPin size={13} />
          <span>Fuel Risk Hotspots ({activeHotspots.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('drain')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
            activeTab === 'drain'
              ? 'bg-white text-sky-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Droplets size={13} />
          <span>Fuel Drain Map</span>
        </button>
      </div>

      {activeTab === 'drain' && (
        <DrainHotspotMap mapLoaded={mapLoaded} onCreateZone={handleCreateZone} />
      )}

      {activeTab === 'hotspots' && (
        <>
          {/* Framed Google Map Card with Enclosed KPI Strip & Legend */}
          <div className="hs-map-card">
            <div className="hs-map-head">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Fuel Risk Hotspots &amp; Live Fleet Watch
                </span>
              </div>

              {/* Enclosed KPI Rail */}
              <div className="hs-kpi-strip">
                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-orange-50 text-orange-600 border border-orange-200">
                    <MapPin size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Risk Hotspots</span>
                    <span className="hs-kpi-pill-value text-orange-600">
                      {formatNum(activeHotspots.length)}
                    </span>
                  </div>
                </div>

                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-blue-50 text-blue-600 border border-blue-200">
                    <Globe size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Network Moat</span>
                    <span className="hs-kpi-pill-value">{formatNum(networkHotspotCount)}</span>
                  </div>
                </div>

                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-slate-100 text-slate-600 border border-slate-200">
                    <Truck size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Live Fleet</span>
                    <span className="hs-kpi-pill-value">{formatNum(validLiveVehicles.length)}</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="hs-legend-group">
                <span className="hs-legend-pill">
                  <span className="hs-legend-dot" style={{ background: '#6366F1' }} />
                  <span>Learned Hotspot</span>
                </span>
                <span className="hs-legend-pill">
                  <span className="hs-legend-dot" style={{ background: '#2563EB' }} />
                  <span>Network Cluster</span>
                </span>
                <span className="hs-legend-pill">
                  <span className="hs-legend-dot" style={{ background: '#22c55e' }} />
                  <span>Moving</span>
                </span>
                <span className="hs-legend-pill">
                  <span className="hs-legend-dot" style={{ background: '#8b5cf6' }} />
                  <span>Stopped</span>
                </span>
                <span className="hs-legend-pill">
                  <span className="hs-legend-dot" style={{ background: '#f59e0b' }} />
                  <span>Idling</span>
                </span>
                <span className="hs-legend-pill">
                  <span className="hs-legend-dot" style={{ background: '#94a3b8' }} />
                  <span>Offline</span>
                </span>
              </div>
            </div>

            {/* Ambient status ribbon bar */}
            {activeHotspots.length === 0 ? (
              <div className="hs-status-strip hs-status-strip--emerald">
                <div
                  className="hs-status-strip-badge"
                  style={{ borderColor: '#10b981', color: '#065f46' }}
                >
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>No active fuel risk hotspots</span>
                </div>
              </div>
            ) : null}
            {/* Map */}
            <div className="gf-map-wrap" style={{ border: 'none', borderRadius: 0, margin: 0 }}>
              {mapLoaded ? (
                <GoogleMap
                  mapContainerClassName="gf-map"
                  center={MAP_CENTER}
                  zoom={5}
                  options={MAP_OPTIONS}
                  onLoad={(map) => {
                    mapRef.current = map;
                  }}
                >
                  {/* 1. Fuel Risk Hotspots (Circles + Pins) */}
                  {hotspotsWithPos.map((h) => (
                    <React.Fragment key={h._id}>
                      <MarkerF
                        position={h.position}
                        icon={{
                          url:
                            h.meta.color === '#2563EB'
                              ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                              : 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
                        }}
                        zIndex={5}
                        title={`Fuel Risk Hotspot: ${h.name}`}
                        onClick={() => {
                          setSelectedHotspot(h);
                          setSelectedVehicle(null);
                        }}
                      />
                      <CircleF
                        center={h.position}
                        radius={h.radius}
                        options={{
                          fillColor: h.meta.color,
                          fillOpacity: 0.18,
                          strokeColor: h.meta.color,
                          strokeOpacity: 0.85,
                          strokeWeight: 2,
                        }}
                      />
                    </React.Fragment>
                  ))}

                  {/* 2. Live Fleet Vehicle Pins */}
                  {validLiveVehicles.map((v) => {
                    const iconObj = vehicleIcons[v.status] || vehicleIcons.Offline;
                    return (
                      <MarkerF
                        key={v.vehicleId || v.registrationNumber}
                        position={{ lat: v.lat, lng: v.lng }}
                        icon={iconObj || undefined}
                        zIndex={10}
                        title={`${v.registrationNumber} (${v.status})`}
                        onClick={() => {
                          setSelectedVehicle(v);
                          setSelectedHotspot(null);
                        }}
                      />
                    );
                  })}

                  {/* InfoWindow: Fuel Risk Hotspot */}
                  {selectedHotspot && (
                    <InfoWindowF
                      position={{
                        lat: selectedHotspot.centerLat ?? selectedHotspot.lat,
                        lng: selectedHotspot.centerLng ?? selectedHotspot.lng,
                      }}
                      onCloseClick={() => setSelectedHotspot(null)}
                    >
                      <div className="gf-infowindow">
                        <p className="gf-iw-title">
                          <ShieldAlert
                            size={14}
                            style={{ display: 'inline', marginRight: 5, color: '#d97706' }}
                          />
                          {selectedHotspot.name}
                        </p>
                        <div style={{ marginTop: 4, marginBottom: 6 }}>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                            style={{
                              background: `${
                                (
                                  PROVENANCE_META[GeofenceService.provenanceOf(selectedHotspot)] ||
                                  PROVENANCE_META['own-learned']
                                ).color
                              }18`,
                              color: (
                                PROVENANCE_META[GeofenceService.provenanceOf(selectedHotspot)] ||
                                PROVENANCE_META['own-learned']
                              ).color,
                            }}
                          >
                            {
                              (
                                PROVENANCE_META[GeofenceService.provenanceOf(selectedHotspot)] ||
                                PROVENANCE_META['own-learned']
                              ).label
                            }
                          </span>
                        </div>
                        <p className="gf-iw-stat">
                          Radius:{' '}
                          <strong>
                            {selectedHotspot.radiusMeters || selectedHotspot.radiusM || 500}m
                          </strong>
                          {selectedHotspot.theftIncidentCount != null && (
                            <>
                              {' '}
                              · <strong>{selectedHotspot.theftIncidentCount}</strong> incident
                              {selectedHotspot.theftIncidentCount !== 1 ? 's' : ''}
                            </>
                          )}
                        </p>
                        {selectedHotspot.totalFuelStolenLitres != null && (
                          <p className="gf-iw-stat">
                            Est. fuel stolen:{' '}
                            <strong>{formatLitres(selectedHotspot.totalFuelStolenLitres)}</strong>
                          </p>
                        )}
                        <p
                          className="gf-iw-stat"
                          style={{ color: '#64748b', fontSize: '11px', marginTop: 3 }}
                        >
                          Last activity: {formatLastIncident(selectedHotspot.lastIncidentAt)}
                        </p>
                        <div
                          style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleCreateZone({
                                lat: selectedHotspot.centerLat ?? selectedHotspot.lat,
                                lng: selectedHotspot.centerLng ?? selectedHotspot.lng,
                                name: `Zone - ${selectedHotspot.name}`,
                              })
                            }
                            className="gf-btn gf-btn-primary"
                            style={{
                              width: '100%',
                              justifyContent: 'center',
                              fontSize: '11px',
                              padding: '5px 8px',
                            }}
                          >
                            <Plus size={12} /> Convert to Geofence Zone
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActiveHotspot(selectedHotspot)}
                            className="gf-btn gf-btn-ghost"
                            style={{
                              width: '100%',
                              justifyContent: 'center',
                              fontSize: '11px',
                              padding: '4px 8px',
                              color: '#e11d48',
                            }}
                          >
                            <EyeOff size={12} /> Dismiss Hotspot
                          </button>
                        </div>
                      </div>
                    </InfoWindowF>
                  )}

                  {/* InfoWindow: Live Fleet Vehicle */}
                  {selectedVehicle && (
                    <InfoWindowF
                      position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                      onCloseClick={() => setSelectedVehicle(null)}
                    >
                      <div className="gf-infowindow">
                        <p className="gf-iw-title">
                          <Truck size={13} style={{ display: 'inline', marginRight: 4 }} />
                          {selectedVehicle.registrationNumber}
                        </p>
                        <p className="gf-iw-stat">
                          Status:{' '}
                          <strong
                            style={{
                              color: VEHICLE_STATUS_COLOR[selectedVehicle.status] || '#64748b',
                            }}
                          >
                            {selectedVehicle.status || 'Unknown'}
                          </strong>
                        </p>
                        {selectedVehicle.speed != null && (
                          <p className="gf-iw-stat">
                            Speed: {selectedVehicle.speed?.toFixed(1)} kmph
                          </p>
                        )}
                        {selectedVehicle.fuelLevel != null && (
                          <p className="gf-iw-stat">
                            Fuel: {selectedVehicle.fuelLevel?.toFixed(1)} L
                          </p>
                        )}
                        <p
                          className="gf-iw-stat"
                          style={{ color: '#64748b', fontSize: '11px', marginTop: 4 }}
                        >
                          {fromNow(selectedVehicle.lastSeenAt)}
                        </p>
                      </div>
                    </InfoWindowF>
                  )}
                </GoogleMap>
              ) : (
                <div className="gf-map-placeholder">
                  <RefreshCw size={18} className="gf-spin" />
                  <span>Loading surveillance map layers…</span>
                </div>
              )}
            </div>
          </div>

          {/* Fuel Risk Hotspots List */}
          {activeTab === 'hotspots' && (
            <div className="space-y-6 mt-4">
              {/* Active Monitored Hotspots */}
              <div className="oa-table-wrapper">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Active Monitored Risk Hotspots ({filteredActiveHotspots.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Learned from fleet telemetry and national corridor network. Trucks lingering
                      here automatically flag fuel theft risk.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCreateZone()}
                    className="gf-btn gf-btn-primary text-xs"
                  >
                    <Plus size={13} /> Add Manual Hotspot Zone
                  </button>
                </div>

                {filteredActiveHotspots.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    {hotspotNeedle
                      ? `No active hotspots match "${hotspotQuery.trim()}".`
                      : 'No active risk hotspots recorded.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="oa-table">
                      <thead>
                        <tr>
                          <th>Zone Name</th>
                          <th>Source Provenance</th>
                          <th style={{ textAlign: 'right' }}>Radius</th>
                          <th style={{ textAlign: 'right' }}>Stolen Litres</th>
                          <th style={{ textAlign: 'center' }}>Incidents</th>
                          <th>Last Activity</th>
                          <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredActiveHotspots.map((h) => {
                          const prov = GeofenceService.provenanceOf(h);
                          const meta = PROVENANCE_META[prov] || PROVENANCE_META['own-learned'];
                          return (
                            <tr key={h._id}>
                              <td className="font-semibold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <ShieldAlert size={14} className="text-amber-600 flex-shrink-0" />
                                  <span>{h.name || 'Unnamed Hotspot'}</span>
                                </div>
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
                              <td
                                style={{ textAlign: 'right' }}
                                className="num font-mono text-slate-700"
                              >
                                {h.radiusMeters || h.radiusM || 500}m
                              </td>
                              <td
                                style={{ textAlign: 'right' }}
                                className="num font-mono text-rose-700 font-bold"
                              >
                                {h.totalFuelStolenLitres
                                  ? `${h.totalFuelStolenLitres.toFixed(0)} L`
                                  : '—'}
                              </td>
                              <td
                                style={{ textAlign: 'center' }}
                                className="num font-mono text-slate-700"
                              >
                                {h.theftIncidentCount ?? h.incidentCount ?? '—'}
                              </td>
                              <td className="text-xs text-slate-600">
                                {formatLastIncident(h.lastIncidentAt)}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    className="gf-btn gf-btn-icon"
                                    onClick={() =>
                                      handleCreateZone({
                                        lat: h.centerLat ?? h.lat,
                                        lng: h.centerLng ?? h.lng,
                                        name: `Zone - ${h.name}`,
                                      })
                                    }
                                    title="Convert to custom geofence zone"
                                  >
                                    <Plus size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className="oa-ack-action"
                                    disabled={busyHotspotId === h._id}
                                    onClick={() => toggleActiveHotspot(h)}
                                    title="Dismiss this hotspot from active surveillance"
                                  >
                                    <EyeOff size={13} />
                                    <span>Dismiss</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Dismissed Hotspots Section */}
              {dismissedHotspots.length > 0 && (
                <div className="oa-table-wrapper">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700">
                      Dismissed Hotspots ({dismissedHotspots.length})
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
                        {dismissedHotspots.map((h) => (
                          <tr key={h._id} className="opacity-75">
                            <td className="font-medium text-slate-700">
                              {h.name || 'Unnamed Hotspot'}
                            </td>
                            <td>
                              <span className="text-xs text-slate-500">Dismissed</span>
                            </td>
                            <td
                              style={{ textAlign: 'right' }}
                              className="num font-mono text-slate-500"
                            >
                              {h.radiusMeters || h.radiusM || 500}m
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="oa-ack-action"
                                disabled={busyHotspotId === h._id}
                                onClick={() => toggleActiveHotspot(h)}
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
          )}
        </>
      )}

      {/* Draw Zone Drawer */}
      {showZoneDrawer && (
        <AddZoneDrawer
          prefillLatLng={zonePrefillLatLng}
          prefillName={zonePrefillName}
          mode="add"
          onClose={() => {
            setShowZoneDrawer(false);
            setZonePrefillLatLng(null);
            setZonePrefillName('');
          }}
          onSaved={() => {
            setShowZoneDrawer(false);
            setZonePrefillLatLng(null);
            setZonePrefillName('');
            toast.success('Zone created');
          }}
        />
      )}
    </PageShell>
  );
};

export default GeofencePage;
