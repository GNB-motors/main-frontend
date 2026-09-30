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
} from 'lucide-react';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { GeofenceService } from '../../services/GeofenceService.jsx';
import { toast } from 'react-toastify';
import { humanise } from '../../lib/vocabulary';
import { footerSummary } from '../../lib/tableState';
import { formatNum } from '../../utils/formatters';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import ExportButton from '../../components/ui/ExportButton';
import PlaceLabel from '../../components/ui/PlaceLabel';
import { useLivePositions } from '../../hooks/useLivePositions';
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
  Faulty: '#84cc16', // sieve green
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

// ─── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = (props) => {
  const { icon: Icon, label, value, colorClass } = props;
  return (
    <div className={`gf-kpi-card gf-kpi-${colorClass}`}>
      <div className="gf-kpi-icon-wrap">
        <Icon size={20} />
      </div>
      <div className="gf-kpi-content">
        <span className="gf-kpi-label">{label}</span>
        <span className="gf-kpi-value">{value ?? 0}</span>
      </div>
    </div>
  );
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

// ─── Map Legend ────────────────────────────────────────────────────────────────
const LegendItem = ({ color, label }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '11px',
      color: '#475569',
      fontWeight: 500,
    }}
  >
    <div
      style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }}
    ></div>
    {label}
  </div>
);

const MapLegend = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
      padding: '10px 16px',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '12px',
    }}
  >
    <div style={{ fontWeight: 600, color: '#1e293b', marginRight: '4px' }}>Vehicle Status:</div>
    <LegendItem color={VEHICLE_STATUS_COLOR.Moving} label="Moving" />
    <LegendItem color={VEHICLE_STATUS_COLOR.Stopped} label="Stopped" />
    <LegendItem color={VEHICLE_STATUS_COLOR.Idling} label="Idling" />
    <LegendItem color={VEHICLE_STATUS_COLOR.Offline} label="Offline / Stale" />
    <LegendItem color={VEHICLE_STATUS_COLOR.Breakdown} label="Breakdown" />
    <LegendItem color={VEHICLE_STATUS_COLOR.Faulty} label="Faulty" />
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
  HIGH: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  MEDIUM: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  LOW: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
};

// Export shape for the anomaly location table — humanised severity, resolved
// place names where the backend has one, never raw coordinates.
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
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'drain' ? 'drain' : 'anomalies',
  );
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resolvingId, setResolvingId] = useState(null);
  const [selectedLoc, setSelectedLoc] = useState(null);
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
  // The hook resumes the old 5s poll by itself if the stream is unavailable.
  const liveEnabled = import.meta.env.VITE_GEOFENCE_FLEETEDGE_ENABLED !== 'false';
  const { positions: liveVehicles, error: liveError } = useLivePositions({
    enabled: liveEnabled,
    initialFetch: () => GeofenceService.getLiveLocations(),
    mapStreamRow: toGeofenceLiveVehicle,
    fallbackPollMs: 5000,
  });
  const liveOnline = liveEnabled && !liveError;
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
      const [locData, statsData] = await Promise.all([
        GeofenceService.getAnomalyLocations(params),
        GeofenceService.getAnomalyStats(),
      ]);
      setLocations(locData.locations || []);
      setTotalPages(locData.totalPages || 1);
      setStats(statsData);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page, severityFilter, showResolved]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fit bounds when data changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // Only fit bounds if we have either locations or vehicles
    if (locations.length === 0 && liveVehicles.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    locations.forEach((loc) => {
      if (loc.lat && loc.lng) {
        bounds.extend({ lat: loc.lat, lng: loc.lng });
        hasPoints = true;
      }
    });

    liveVehicles.forEach((v) => {
      if (v.lat && v.lng) {
        bounds.extend({ lat: v.lat, lng: v.lng });
        hasPoints = true;
      }
    });

    if (hasPoints) {
      mapRef.current.fitBounds(bounds);

      // Prevent too much zoom if there's only one point
      const listener = window.google.maps.event.addListener(mapRef.current, 'idle', () => {
        if (mapRef.current.getZoom() > 14) mapRef.current.setZoom(14);
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [locations, liveVehicles, mapLoaded]);

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

  // Client-side search over the loaded page — the anomaly endpoint has no q param.
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

  const locationsWithPos = useMemo(() => {
    return filteredLocations.map((loc) => ({
      ...loc,
      position: { lat: loc.lat, lng: loc.lng },
      icon: { url: PIN[loc.severity] || PIN.LOW },
    }));
  }, [filteredLocations]);

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
      title="Geofence Anomalies"
      subtitle="Locations where vehicles stopped and unexplained fuel was lost"
      count={stats?.total ?? null}
      actions={
        <>
          <button className="gf-btn gf-btn-primary" onClick={() => handleCreateZone()}>
            <Plus size={14} /> Add Custom Zone
          </button>
          <Link to="/geofence-zones" className="gf-btn gf-btn-ghost">
            <MapPin size={14} /> Risk Zones
          </Link>
          <Link to="/hotspots" className="gf-btn gf-btn-ghost">
            <ShieldAlert size={14} /> Risk Hotspots
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
        ) : null
      }
      footer={
        activeTab === 'anomalies'
          ? footerSummary({
              showing: filteredLocations.length,
              total: locations.length,
              activeFilters: locationFilterCount,
            }) + ' on this page'
          : null
      }
    >
      {/* View Switcher: Anomalies vs Fuel Drain Map */}
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

      {activeTab === 'anomalies' && (
        <>
          {/* Framed Google Map Card with Enclosed KPI Strip & Legend */}
          <div className="hs-map-card">
            <div className="hs-map-head">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Geofence Anomalies &amp; Fuel Drain Watch
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
                  <span className="hs-kpi-pill-icon bg-rose-50 text-rose-600 border border-rose-200">
                    <XCircle size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">High Severity</span>
                    <span className="hs-kpi-pill-value text-rose-600">
                      {formatNum(stats?.high ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-orange-50 text-orange-600 border border-orange-200">
                    <ShieldAlert size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Medium</span>
                    <span className="hs-kpi-pill-value">{formatNum(stats?.medium ?? 0)}</span>
                  </div>
                </div>

                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-sky-50 text-sky-600 border border-sky-200">
                    <MapPin size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Low</span>
                    <span className="hs-kpi-pill-value">{formatNum(stats?.low ?? 0)}</span>
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
                    <span className="hs-kpi-pill-value">{formatNum(liveVehicles.length)}</span>
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
                  <span className="hs-legend-dot" style={{ background: '#eab308' }} />
                  <span>Low Risk</span>
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
              </div>
            </div>

            {/* Ambient status ribbon bar (rendered below header so legend pills are never covered) */}
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
            ) : stats?.total === 0 ? (
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
                  {locationsWithPos.map((loc) => (
                    <MarkerF
                      key={loc._id}
                      position={loc.position}
                      icon={loc.icon}
                      onClick={() => {
                        setSelectedLoc(loc);
                        setSelectedVehicle(null);
                      }}
                    />
                  ))}
                  {/* Live vehicle pins */}
                  {liveVehicles.map((v) => {
                    const iconUrl = vehicleIcons[v.status] || vehicleIcons.Offline;
                    return (
                      <MarkerF
                        key={v.vehicleId || v.registrationNumber}
                        position={{ lat: v.lat, lng: v.lng }}
                        icon={iconUrl}
                        zIndex={2}
                        onClick={() => {
                          setSelectedVehicle(v);
                          setSelectedLoc(null);
                        }}
                      />
                    );
                  })}
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
                  <span>Loading map…</span>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
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

          {/* Table */}
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

          {/* Pagination */}
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
