import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Fuel,
  Clock,
  Truck,
  ShieldAlert,
  ShieldCheck,
  XCircle,
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
import { humanise } from '../../lib/vocabulary';
import { footerSummary } from '../../lib/tableState';
import { formatNum, formatLitres } from '../../utils/formatters';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import ExportButton from '../../components/ui/ExportButton';
import PlaceLabel from '../../components/ui/PlaceLabel';
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
const formatIST = (d) => (d ? dayjs.utc(d).tz(IST).format('DD MMM YYYY, hh:mm A') : '—');
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

// ─── Severity Badge ────────────────────────────────────────────────────────────
const SeverityBadge = ({ severity }) => {
  const map = {
    HIGH: { cls: 'gf-badge gf-badge-high', label: 'High' },
    MEDIUM: { cls: 'gf-badge gf-badge-medium', label: 'Medium' },
    LOW: { cls: 'gf-badge gf-badge-low', label: 'Low' },
  };
  const cfg = map[severity] || map.LOW;
  return <span className={cfg.cls}>{cfg.label}</span>;
};

// ─── Event Row ─────────────────────────────────────────────────────────────────
const EventRow = ({ event, idx }) => (
  <div className="gf-event-row">
    <span className="gf-event-num">{idx + 1}</span>
    <div className="gf-event-details">
      <div className="gf-event-top">
        <Truck size={12} className="gf-event-icon" />
        <span className="gf-event-vehicle">
          {event.vehicleId?.registrationNumber || event.vehicleNumber || '—'}
        </span>
        {event.driverId?.name && <span className="gf-event-driver">· {event.driverId.name}</span>}
      </div>
      <div className="gf-event-meta">
        <Clock size={11} />
        <span>
          {formatIST(event.stoppedAt)} → {formatIST(event.departedAt)}
        </span>
        <span className="gf-sep">·</span>
        <span>{event.durationMinutes?.toFixed(0)} min stop</span>
        <span className="gf-sep">·</span>
        <span className="gf-fuel-drop">
          <Fuel size={11} /> −{event.fuelDropLitres?.toFixed(1)} L
        </span>
      </div>
    </div>
  </div>
);

// ─── Location Row ──────────────────────────────────────────────────────────────
const LocationRow = ({ location, onResolve, resolvingId, onCreateZone }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr className={`gf-row ${location.severity === 'HIGH' ? 'gf-row-high' : ''}`}>
        <td className="gf-td">
          <div className="gf-location-cell">
            <MapPin size={13} className="gf-pin-icon" />
            <span className="gf-address">
              {location.address || (
                <PlaceLabel lat={location.lat} lng={location.lng} showMap={false} />
              )}
            </span>
          </div>
        </td>
        <td className="gf-td gf-td-c">
          <SeverityBadge severity={location.severity} />
        </td>
        <td className="gf-td gf-td-c">{location.occurrenceCount}</td>
        <td className="gf-td gf-td-r">{location.totalFuelDropLitres?.toFixed(1)} L</td>
        <td className="gf-td gf-td-c">{(location.vehiclesAffected || []).length}</td>
        <td className="gf-td gf-td-c">{formatIST(location.lastSeenAt)}</td>
        <td className="gf-td gf-td-actions">
          {onCreateZone && (
            <button
              className="gf-btn gf-btn-icon"
              onClick={() =>
                onCreateZone({
                  lat: location.lat,
                  lng: location.lng,
                  name: location.address
                    ? `Zone - ${location.address.split(',')[0]}`
                    : 'Risk Anomaly Zone',
                })
              }
              title="Create Custom Geofence Zone around this location"
            >
              <Plus size={14} />
            </button>
          )}
          <button
            className="gf-btn gf-btn-icon"
            onClick={() => setExpanded((p) => !p)}
            title="Show stop events"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {!location.isResolved && (
            <button
              className="gf-btn gf-btn-resolve"
              onClick={() => onResolve(location._id)}
              disabled={resolvingId === location._id}
            >
              {resolvingId === location._id ? (
                <RefreshCw size={12} className="gf-spin" />
              ) : (
                <CheckCircle2 size={12} />
              )}
              Resolve
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="gf-events-row">
          <td colSpan={7} className="gf-events-cell">
            <div className="gf-events-panel">
              <p className="gf-events-heading">
                <ShieldAlert size={13} />
                &nbsp;{(location.events || []).length} suspicious stop
                {(location.events || []).length !== 1 ? 's' : ''} at this location
              </p>
              {(location.events || []).map((ev, i) => (
                <EventRow key={i} event={ev} idx={i} />
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const PIN = {
  HIGH: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  MEDIUM: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  LOW: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
};

// Export shape for the anomaly location table
const LOCATION_EXPORT_COLUMNS = [
  { key: 'address', label: 'Location' },
  { key: 'severity', label: 'Severity' },
  { key: 'occurrenceCount', label: 'Occurrences', type: 'number' },
  { key: 'totalFuelDropLitres', label: 'Total fuel drop (L)', type: 'number' },
  { key: 'vehiclesAffected', label: 'Vehicles affected', type: 'number' },
  { key: 'lastSeenAt', label: 'Last seen' },
  { key: 'status', label: 'Status' },
];
const locationExportRows = (records) =>
  records.map((loc) => ({
    address: loc.address || 'Unresolved location',
    severity: humanise(loc.severity),
    occurrenceCount: loc.occurrenceCount,
    totalFuelDropLitres: loc.totalFuelDropLitres,
    vehiclesAffected: (loc.vehiclesAffected || []).length,
    lastSeenAt: loc.lastSeenAt ? formatIST(loc.lastSeenAt) : '—',
    status: loc.isResolved ? 'Resolved' : 'Open',
  }));

// ─── Main Page ─────────────────────────────────────────────────────────────────
const GeofencePage = () => {
  useFullPageLayout();
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'drain'
      ? 'drain'
      : searchParams.get('tab') === 'hotspots'
        ? 'hotspots'
        : 'anomalies',
  );

  const [locations, setLocations] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [hotspotQuery, setHotspotQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resolvingId, setResolvingId] = useState(null);
  const [selectedLoc, setSelectedLoc] = useState(null);
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

  const LIMIT = 20;

  const { isLoaded: mapLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: LIMIT, isResolved: showResolved };
      if (severityFilter) params.severity = severityFilter;
      const [locData, statsData, hotspotsData] = await Promise.all([
        GeofenceService.getAnomalyLocations(params),
        GeofenceService.getAnomalyStats(),
        GeofenceService.getHotspots(),
      ]);
      setLocations(locData.locations || []);
      setTotalPages(locData.totalPages || 1);
      setStats(statsData);
      setHotspots(Array.isArray(hotspotsData) ? hotspotsData : []);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page, severityFilter, showResolved]);

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

    if (locations.length === 0 && activeHotspots.length === 0 && validLiveVehicles.length === 0)
      return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    locations.forEach((loc) => {
      if (Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
        bounds.extend({ lat: loc.lat, lng: loc.lng });
        hasPoints = true;
      }
    });

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
  }, [locations, activeHotspots, validLiveVehicles, mapLoaded]);

  const handleResolve = async (id) => {
    const note = window.prompt('Resolution note (optional):');
    if (note === null) return;
    setResolvingId(id);
    try {
      await GeofenceService.resolveAnomalyLocation(id, note || null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to resolve');
    } finally {
      setResolvingId(null);
    }
  };

  // Client-side search over the loaded page
  const locationNeedle = locationQuery.trim().toLowerCase();
  const filteredLocations = locationNeedle
    ? locations.filter((loc) =>
        [
          loc.address,
          loc.severity,
          ...(loc.vehiclesAffected || []).map((v) => v.registrationNumber),
        ].some((f) =>
          String(f ?? '')
            .toLowerCase()
            .includes(locationNeedle),
        ),
      )
    : locations;
  const locationFilterCount =
    (severityFilter ? 1 : 0) + (showResolved ? 1 : 0) + (locationNeedle ? 1 : 0);

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

  const locationsWithPos = useMemo(() => {
    return filteredLocations
      .filter((loc) => Number.isFinite(loc.lat) && Number.isFinite(loc.lng))
      .map((loc) => ({
        ...loc,
        position: { lat: loc.lat, lng: loc.lng },
        icon: { url: PIN[loc.severity] || PIN.LOW },
      }));
  }, [filteredLocations]);

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
      title="Geofence & Fuel Risk Hotspots"
      subtitle="Surveillance map tracking live fleet telemetry, fuel loss anomalies, and high-risk siphoning hotspots"
      count={activeTab === 'hotspots' ? activeHotspots.length : (stats?.total ?? null)}
      actions={
        <>
          <button className="gf-btn gf-btn-primary" onClick={() => handleCreateZone()}>
            <Plus size={14} /> Add Custom Zone
          </button>
          <Link to="/geofence/zones" className="gf-btn gf-btn-ghost">
            <MapPin size={14} /> Risk Zones
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
        activeTab === 'anomalies' ? (
          <FilterBar
            searchValue={locationQuery}
            onSearchChange={(v) => {
              setLocationQuery(v);
              setPage(1);
            }}
            searchPlaceholder="Search location or vehicle…"
            activeCount={locationFilterCount}
            onClear={() => {
              setLocationQuery('');
              setSeverityFilter('');
              setShowResolved(false);
              setPage(1);
            }}
            right={
              <ExportButton
                rows={locationExportRows(filteredLocations)}
                columns={LOCATION_EXPORT_COLUMNS}
                filename="geofence-anomalies"
                disabled={loading || !!error}
                meta={{
                  generatedAt: new Date(),
                  filters: [
                    ...(locationNeedle
                      ? [{ label: 'Search (this page)', value: locationQuery.trim() }]
                      : []),
                    {
                      label: 'Severity',
                      value: severityFilter ? humanise(severityFilter) : 'All severities',
                    },
                    { label: 'Status', value: showResolved ? 'Open + resolved' : 'Open only' },
                  ],
                }}
              />
            }
          />
        ) : activeTab === 'hotspots' ? (
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
        activeTab === 'anomalies'
          ? footerSummary({
              showing: filteredLocations.length,
              total: locations.length,
              activeFilters: locationFilterCount,
            }) + ' on this page'
          : activeTab === 'hotspots'
            ? `${filteredActiveHotspots.length} active fuel risk hotspots monitored`
            : null
      }
    >
      {/* View Switcher: Anomalies vs Hotspots vs Fuel Drain Map */}
      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('anomalies')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
            activeTab === 'anomalies'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldAlert size={13} />
          <span>Anomaly Incidents ({stats?.total ?? locations.length})</span>
        </button>
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

      {(activeTab === 'anomalies' || activeTab === 'hotspots') && (
        <>
          {/* Framed Google Map Card with Enclosed KPI Strip & Legend */}
          <div className="hs-map-card">
            <div className="hs-map-head">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Geofence Anomalies, Hotspots &amp; Live Fleet Watch
                </span>
              </div>

              {/* Enclosed KPI Rail */}
              <div className="hs-kpi-strip">
                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-amber-50 text-amber-600 border border-amber-200">
                    <AlertTriangle size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Open Anomalies</span>
                    <span className="hs-kpi-pill-value">{formatNum(stats?.total ?? 0)}</span>
                  </div>
                </div>

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
                  <span className="hs-kpi-pill-icon bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <CheckCircle2 size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Resolved</span>
                    <span className="hs-kpi-pill-value text-emerald-700">
                      {formatNum(stats?.resolved ?? 0)}
                    </span>
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
                  <span className="hs-legend-dot" style={{ background: '#ef4444' }} />
                  <span>High Risk</span>
                </span>
                <span className="hs-legend-pill">
                  <span className="hs-legend-dot" style={{ background: '#f59e0b' }} />
                  <span>Medium Risk</span>
                </span>
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
            {stats?.high > 0 ? (
              <div className="hs-status-strip hs-status-strip--rose">
                <div
                  className="hs-status-strip-badge"
                  style={{ borderColor: '#ef4444', color: '#991b1b' }}
                >
                  <AlertTriangle size={15} className="text-rose-600" />
                  <span>
                    {stats.high} Critical Fuel Drain Incident{stats.high !== 1 ? 's' : ''} Flagged
                  </span>
                </div>
                <span className="rounded-md bg-white border border-rose-300 px-2.5 py-1 text-[11px] font-bold text-rose-800 shadow-xs">
                  High Risk Anomaly Detected
                </span>
              </div>
            ) : stats?.total === 0 && activeHotspots.length === 0 ? (
              <div className="hs-status-strip hs-status-strip--emerald">
                <div
                  className="hs-status-strip-badge"
                  style={{ borderColor: '#10b981', color: '#065f46' }}
                >
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Corridors Clear · No Unexplained Fuel Losses Recorded</span>
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
                  {/* 1. Anomaly Flagged Locations */}
                  {locationsWithPos.map((loc) => (
                    <MarkerF
                      key={loc._id}
                      position={loc.position}
                      icon={loc.icon}
                      zIndex={4}
                      title={`Anomaly: ${loc.address || 'Flagged Location'}`}
                      onClick={() => {
                        setSelectedLoc(loc);
                        setSelectedHotspot(null);
                        setSelectedVehicle(null);
                      }}
                    />
                  ))}

                  {/* 2. Fuel Risk Hotspots (Circles + Pins) */}
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
                          setSelectedLoc(null);
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

                  {/* 3. Live Fleet Vehicle Pins */}
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
                          setSelectedLoc(null);
                          setSelectedHotspot(null);
                        }}
                      />
                    );
                  })}

                  {/* InfoWindow: Anomaly Location */}
                  {selectedLoc && (
                    <InfoWindowF
                      position={{ lat: selectedLoc.lat, lng: selectedLoc.lng }}
                      onCloseClick={() => setSelectedLoc(null)}
                    >
                      <div className="gf-infowindow">
                        <p className="gf-iw-title">
                          {selectedLoc.address || (
                            <PlaceLabel
                              lat={selectedLoc.lat}
                              lng={selectedLoc.lng}
                              showMap={false}
                            />
                          )}
                        </p>
                        <p className="gf-iw-stat">
                          <strong>{selectedLoc.occurrenceCount}</strong> occurrence
                          {selectedLoc.occurrenceCount !== 1 ? 's' : ''}
                          &nbsp;·&nbsp;
                          <strong>{selectedLoc.totalFuelDropLitres?.toFixed(1)} L</strong> total
                          drop
                        </p>
                        <div style={{ marginTop: 4, marginBottom: 8 }}>
                          <SeverityBadge severity={selectedLoc.severity} />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCreateZone({
                              lat: selectedLoc.lat,
                              lng: selectedLoc.lng,
                              name: selectedLoc.address
                                ? `Zone - ${selectedLoc.address.split(',')[0]}`
                                : 'Risk Anomaly Zone',
                            })
                          }
                          className="gf-btn gf-btn-primary"
                          style={{
                            width: '100%',
                            justifyContent: 'center',
                            fontSize: '11px',
                            padding: '6px 8px',
                          }}
                        >
                          <Plus size={12} /> Create Geofence Zone
                        </button>
                      </div>
                    </InfoWindowF>
                  )}

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

          {/* TAB 1: Anomaly Incidents List & Filters */}
          {activeTab === 'anomalies' && (
            <>
              <div className="gf-filter-bar">
                <select
                  className="gf-select"
                  value={severityFilter}
                  onChange={(e) => {
                    setSeverityFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All severities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <label className="gf-check-label">
                  <input
                    type="checkbox"
                    checked={showResolved}
                    onChange={(e) => {
                      setShowResolved(e.target.checked);
                      setPage(1);
                    }}
                  />
                  Show resolved
                </label>
                <span className="gf-count-label">
                  {stats ? `${stats.total} open location${stats.total !== 1 ? 's' : ''}` : ''}
                </span>
              </div>

              {error && (
                <div className="gf-error-banner">
                  <AlertTriangle size={15} /> {error}
                </div>
              )}

              {loading ? (
                <div className="gf-loading">
                  <RefreshCw size={20} className="gf-spin" />
                  <span>Analysing locations…</span>
                </div>
              ) : locations.length === 0 ? (
                <div className="gf-empty">
                  <CheckCircle2 size={40} color="#22c55e" />
                  <p>No suspicious locations detected.</p>
                  <span>
                    Anomalies appear here after mileage intervals are computed from FleetEdge data.
                  </span>
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="gf-empty">
                  <AlertTriangle size={40} color="#f59e0b" />
                  <p>No locations on this page match “{locationQuery.trim()}”.</p>
                  <span>
                    Search narrows the loaded page only — try another term or clear the search.
                  </span>
                </div>
              ) : (
                <div className="gf-table-wrap">
                  <table className="gf-table">
                    <thead>
                      <tr>
                        <th className="gf-th">Location</th>
                        <th className="gf-th gf-th-c">Severity</th>
                        <th className="gf-th gf-th-c">Occurrences</th>
                        <th className="gf-th gf-th-r">Total Fuel Drop</th>
                        <th className="gf-th gf-th-c">Vehicles</th>
                        <th className="gf-th gf-th-c">Last Seen</th>
                        <th className="gf-th gf-th-c">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLocations.map((loc) => (
                        <LocationRow
                          key={loc._id}
                          location={loc}
                          onResolve={handleResolve}
                          resolvingId={resolvingId}
                          onCreateZone={handleCreateZone}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="gf-pagination">
                  <button
                    className="gf-btn gf-btn-page"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span className="gf-page-label">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="gf-btn gf-btn-page"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: Fuel Risk Hotspots List */}
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

      {/* Add Custom Zone Drawer */}
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
            toast.success('Custom geofence zone created successfully');
          }}
        />
      )}
    </PageShell>
  );
};

export default GeofencePage;
