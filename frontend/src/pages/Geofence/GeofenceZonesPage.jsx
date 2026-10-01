import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  MapPin,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  ParkingCircle,
  X,
  Wifi,
  WifiOff,
  Truck,
  Edit2,
  Compass,
  CheckCheck,
  Navigation,
  LogIn,
  LogOut,
  Layers,
  Droplets,
} from 'lucide-react';
import {
  GoogleMap,
  useLoadScript,
  MarkerF,
  CircleF,
  InfoWindowF,
  PolygonF,
} from '@react-google-maps/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import AddZoneDrawer from './AddZoneDrawer.jsx';
import UnknownTerritoryDrawer from './UnknownTerritoryDrawer.jsx';
import DrainHotspotMap from '../Hotspots/DrainHotspotMap.jsx';
import { GeofenceService } from '../../services/GeofenceService.jsx';
import { KaaranService } from '../../services/KaaranService';
import { formatNum } from '../../utils/formatters';
import { label, humanise } from '../../lib/vocabulary';
import { footerSummary } from '../../lib/tableState';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import ExportButton from '../../components/ui/ExportButton';
import { useConfirm } from '../../components/ui/confirmContext';
import { useLivePositions } from '../../hooks/useLivePositions';
import { toGeofenceLiveVehicle } from './geofenceLive.shared.js';
import { toast } from 'react-toastify';
import '../Hotspots/Hotspots.css';
import './GeofenceZones.css';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// Static — prevents @react-google-maps/api performance warning
const GMAPS_LIBS = ['places', 'geometry'];

const IST = 'Asia/Kolkata';
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

const ZONE_CFG = {
  ACCIDENT_PRONE: {
    label: 'Accident Prone',
    color: '#ef4444',
    fill: '#ef444426',
    pin: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    badgeCls: 'gfz-badge-danger',
  },
  PARKING: {
    label: 'Parking / Rest',
    color: '#f59e0b',
    fill: '#f59e0b26',
    pin: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
    badgeCls: 'gfz-badge-warning',
  },
  CUSTOM: {
    label: 'Custom Zone',
    color: '#6366f1',
    fill: '#6366f126',
    pin: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    badgeCls: 'gfz-badge-info',
  },
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

const GEOFENCE_BADGE_SVG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
  <path d="M7 9C10 6.5 14 6.5 17 9" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M9 12C11 10.5 13 10.5 15 12" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="12" cy="15" r="1.5" fill="#ffffff"/>
</svg>
`)}`;

const VEHICLE_STATUS_COLOR = {
  Moving: '#22c55e', // green
  Stopped: '#8b5cf6', // purple
  Idling: '#f59e0b', // yellowish-orange
  Offline: '#94a3b8', // grey
  Breakdown: '#ef4444', // red
  Faulty: '#84cc16', // sieve green
};

const ZoneTypeBadge = ({ zoneType }) => {
  const cfg = ZONE_CFG[zoneType] || ZONE_CFG.CUSTOM;
  return <span className={`gfz-badge ${cfg.badgeCls}`}>{cfg.label}</span>;
};

// Export shape for the zone table — humanised types, no raw ids or UPPER_SNAKE.
const ZONE_EXPORT_COLUMNS = [
  { key: 'name', label: 'Zone name' },
  { key: 'zoneType', label: 'Type' },
  { key: 'shape', label: 'Shape' },
  { key: 'radiusMetres', label: 'Radius (m)', type: 'number' },
  { key: 'alertOnEntry', label: 'Entry alert' },
  { key: 'alertOnExit', label: 'Exit alert' },
  { key: 'state', label: 'State' },
  { key: 'highway', label: 'Highway' },
  { key: 'status', label: 'Status' },
];
const zoneExportRows = (records) =>
  records.map((z) => ({
    name: z.name,
    zoneType: ZONE_CFG[z.zoneType]?.label || humanise(z.zoneType),
    shape: z.geofenceType === 'polygon' ? 'Polygon' : 'Circular',
    radiusMetres: z.radiusMetres > 0 ? z.radiusMetres : null,
    alertOnEntry: z.alertConfig?.alertOnEntry ? 'Yes' : 'No',
    alertOnExit: z.alertConfig?.alertOnExit ? 'Yes' : 'No',
    state: z.state || '—',
    highway: z.highway || '—',
    status: z.isActive ? 'Active' : 'Inactive',
  }));

const ALERT_EXPORT_COLUMNS = [
  { key: 'createdAt', label: 'Timestamp' },
  { key: 'vehicleNumber', label: 'Vehicle' },
  { key: 'zoneName', label: 'Zone Name' },
  { key: 'zoneType', label: 'Zone Type' },
  { key: 'eventType', label: 'Event' },
  { key: 'speedKmph', label: 'Speed (km/h)', type: 'number' },
  { key: 'status', label: 'Status' },
];

const alertExportRows = (records) =>
  records.map((a) => ({
    createdAt: a.createdAt
      ? dayjs.utc(a.createdAt).tz('Asia/Kolkata').format('DD MMM YYYY, hh:mm A')
      : '—',
    vehicleNumber: a.vehicleNumber || '—',
    zoneName: a.zoneName || '—',
    zoneType: ZONE_CFG[a.zoneType]?.label || humanise(a.zoneType),
    eventType:
      a.eventType === 'ENTRY' ? 'Entry' : a.eventType === 'EXIT' ? 'Exit' : a.eventType || '—',
    speedKmph: a.speedKmph != null ? a.speedKmph : '—',
    status: a.isRead ? 'Read' : 'Unread',
  }));

const KpiCard = (props) => {
  const { icon: Icon, label, value, colorClass } = props;
  return (
    <div className={`gfz-kpi gfz-kpi-${colorClass}`}>
      <div className="gfz-kpi-icon">
        <Icon size={18} />
      </div>
      <div>
        <p className="gfz-kpi-label">{label}</p>
        <p className="gfz-kpi-value">{value ?? 0}</p>
      </div>
    </div>
  );
};

const AlertPanel = ({ alerts, onMarkRead, onClose }) => (
  <div className="gfz-alerts-panel">
    <div className="gfz-alerts-hdr">
      <ShieldAlert size={14} /> <span>Zone Alerts</span>
      <button className="gfz-btn gfz-btn-icon gfz-ml-auto" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
    {alerts.length === 0 ? (
      <div className="gfz-alerts-empty">
        <CheckCircle2 size={16} color="#22c55e" /> No unread alerts
      </div>
    ) : (
      alerts.map((a) => {
        const cfg = ZONE_CFG[a.zoneType] || ZONE_CFG.CUSTOM;
        return (
          <div key={a._id} className="gfz-alert-row">
            <div className="gfz-alert-dot" style={{ background: cfg.color }} />
            <div className="gfz-alert-body">
              <p className="gfz-alert-title">
                <strong>{a.vehicleNumber}</strong>
                &nbsp;{a.eventType === 'ENTRY' ? 'entered' : 'exited'}&nbsp;
                <strong>{a.zoneName}</strong>
                {a.speedKmph != null && (
                  <span className="gfz-alert-speed"> · {a.speedKmph} kmph</span>
                )}
              </p>
              <p className="gfz-alert-time">{fromNow(a.createdAt)}</p>
            </div>
            <button
              className="gfz-btn gfz-btn-icon"
              onClick={() => onMarkRead(a._id)}
              title="Mark read"
            >
              <CheckCircle2 size={13} color="#22c55e" />
            </button>
          </div>
        );
      })
    )}
  </div>
);

// ─── Map Legend ────────────────────────────────────────────────────────────────
const LegendItem = ({ color, label, isSvg }) => (
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
    {isSvg ? (
      <img src={GEOFENCE_BADGE_SVG} alt="icon" style={{ width: 14, height: 14 }} />
    ) : (
      <div
        style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }}
      ></div>
    )}
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
    <div style={{ borderLeft: '1px solid #e2e8f0', height: '16px', margin: '0 4px' }}></div>
    <LegendItem isSvg={true} label="In Geofenced Zone" />
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
const GeofenceZonesPage = ({ defaultTab = 'zones' }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialTab =
    defaultTab === 'alerts' ||
    location.pathname.endsWith('/alerts') ||
    searchParams.get('tab') === 'alerts'
      ? 'alerts'
      : searchParams.get('tab') === 'drain'
        ? 'drain'
        : 'zones';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [zones, setZones] = useState([]);
  const confirm = useConfirm();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingTerritoryCount, setPendingTerritoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [zoneQuery, setZoneQuery] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showUnknownTerritory, setShowUnknownTerritory] = useState(false);
  const [clickedLatLng, setClickedLatLng] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editingZone, setEditingZone] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const liveIntervalRef = useRef(null);

  // Alerts console state
  const [alertFilterUnreadOnly, setAlertFilterUnreadOnly] = useState(false);
  const [alertTypeFilter, setAlertTypeFilter] = useState('');
  const [alertQuery, setAlertQuery] = useState('');
  const [alertLoading, setAlertLoading] = useState(false);

  // Vehicle pins ride the shared `positions` stream (hook handles its own REST
  // fallback). Zone alerts do NOT: the backend `alerts` event carries
  // Fetch and normalize live fleet coordinates
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
    fallbackPollMs: 15_000,
  });
  const liveOnline = liveEnabled && !liveError;

  const validLiveVehicles = useMemo(() => {
    return (liveVehicles || [])
      .map(toGeofenceLiveVehicle)
      .filter((v) => v && Number.isFinite(v.lat) && Number.isFinite(v.lng));
  }, [liveVehicles]);

  const { isLoaded: mapLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GMAPS_LIBS,
  });

  // ── Fetch Zones ───────────────────────────────────────────────────────────
  const fetchZones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { isActive: showResolved ? undefined : 'true', limit: 5000 };
      if (typeFilter) params.zoneType = typeFilter;
      const [zonesData, alertsData, count, pendingTerritories] = await Promise.all([
        GeofenceService.getZones(params),
        GeofenceService.getAlerts({ isRead: 'false', limit: 50 }),
        GeofenceService.getUnreadAlertCount(),
        KaaranService.getUnknownTerritories({ status: 'PENDING' }).catch(() => []),
      ]);
      setZones(zonesData.zones || []);
      setAlerts(alertsData.alerts || []);
      setUnreadCount(count);
      setPendingTerritoryCount(Array.isArray(pendingTerritories) ? pendingTerritories.length : 0);
    } catch (err) {
      setError(err.message || 'Failed to load zones');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, showResolved]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // ── Zone alerts (poll + parameterised by filter) ──────────────────────────
  const fetchAlerts = useCallback(async () => {
    setAlertLoading(true);
    try {
      const params = { limit: 250 };
      if (alertFilterUnreadOnly) params.isRead = 'false';
      if (alertTypeFilter) params.zoneType = alertTypeFilter;
      const [alertsData, count] = await Promise.all([
        GeofenceService.getAlerts(params),
        GeofenceService.getUnreadAlertCount(),
      ]);
      setAlerts(alertsData.alerts || []);
      setUnreadCount(count);
    } catch {
      // A failed alerts refresh leaves the previous list on screen
    } finally {
      setAlertLoading(false);
    }
  }, [alertFilterUnreadOnly, alertTypeFilter]);

  useEffect(() => {
    fetchAlerts();
    liveIntervalRef.current = setInterval(fetchAlerts, 30_000);
    return () => clearInterval(liveIntervalRef.current);
  }, [fetchAlerts]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMapClick = (e) => {
    setClickedLatLng({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setShowDrawer(true);
  };

  const handleDelete = async (zoneId) => {
    const ok = await confirm({
      title: 'Delete this custom zone?',
      body: 'Vehicles inside it stop generating zone alerts until you recreate it.',
      confirmLabel: 'Delete zone',
      danger: true,
    });
    if (!ok) return;
    setDeletingId(zoneId);
    try {
      await GeofenceService.deleteZone(zoneId);
      fetchZones();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkRead = async (alertId) => {
    await GeofenceService.markAlertsRead([alertId]);
    setAlerts((p) => p.map((a) => (a._id === alertId ? { ...a, isRead: true } : a)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    try {
      await GeofenceService.markAllAlertsRead();
      setAlerts((p) => p.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
      toast.success('All alerts marked as read');
    } catch {
      toast.error('Failed to mark all alerts as read');
    }
  };

  const handleLocateZone = (alert) => {
    const matched = zones.find((z) => z._id === alert.zoneId || z.name === alert.zoneName);
    if (matched) {
      setSelectedZone(matched);
      setSelectedVehicle(null);
    }
    setActiveTab('zones');
  };

  const accidentCount = zones.filter((z) => z.zoneType === 'ACCIDENT_PRONE').length;
  const parkingCount = zones.filter((z) => z.zoneType === 'PARKING').length;
  const customCount = zones.filter((z) => z.zoneType === 'CUSTOM').length;

  // Client-side name search for zones
  const zoneNeedle = zoneQuery.trim().toLowerCase();
  const filteredZones = zoneNeedle
    ? zones.filter((z) =>
        String(z.name ?? '')
          .toLowerCase()
          .includes(zoneNeedle),
      )
    : zones;
  const zoneFilterCount = (typeFilter ? 1 : 0) + (showResolved ? 1 : 0) + (zoneNeedle ? 1 : 0);

  // Client-side search for alerts
  const alertNeedle = alertQuery.trim().toLowerCase();
  const filteredAlerts = alertNeedle
    ? alerts.filter((a) =>
        [a.vehicleNumber, a.zoneName, a.zoneType, a.eventType].some((f) =>
          String(f ?? '')
            .toLowerCase()
            .includes(alertNeedle),
        ),
      )
    : alerts;
  const alertFilterCount =
    (alertFilterUnreadOnly ? 1 : 0) + (alertTypeFilter ? 1 : 0) + (alertNeedle ? 1 : 0);

  // ── Memoized Zone Map Objects (prevent re-render lag) ────────────────────
  const memoizedZones = useMemo(() => {
    return zones.map((zone) => {
      const cfg = ZONE_CFG[zone.zoneType] || ZONE_CFG.CUSTOM;
      return {
        ...zone,
        position: { lat: zone.lat, lng: zone.lng },
        markerIcon: { url: cfg.pin },
        circleOptions: {
          strokeColor: cfg.color,
          strokeOpacity: 0.85,
          strokeWeight: 2,
          fillColor: cfg.fill,
          fillOpacity: 1,
        },
        polygonOptions: {
          strokeColor: cfg.color,
          strokeOpacity: 0.85,
          strokeWeight: 2,
          fillColor: cfg.fill,
          fillOpacity: 1,
        },
      };
    });
  }, [zones]);

  // ── Stable Marker Icons for Vehicles ─────────────────────────────────────
  const vehicleIcons = useMemo(() => {
    if (typeof window === 'undefined' || !window.google) return {};
    const size = new window.google.maps.Size(32, 54);
    const anchor = new window.google.maps.Point(16, 27);
    const icons = {};
    for (const [status, url] of Object.entries(FLEET_EDGE_ICONS)) {
      icons[status] = { url, scaledSize: size, anchor };
    }
    return icons;
  }, [mapLoaded]);

  const haloIcon = useMemo(() => {
    if (typeof window === 'undefined' || !window.google) return null;
    return {
      url: GEOFENCE_BADGE_SVG,
      scaledSize: new window.google.maps.Size(24, 24),
      anchor: new window.google.maps.Point(-4, 34),
    };
  }, [mapLoaded]);

  // ── Ultra-fast In-Zone calculation (no native GMaps allocations in loop) ─
  const inZoneVehicleIdSet = useMemo(() => {
    if (!validLiveVehicles?.length || !zones?.length) return new Set();
    const set = new Set();

    const activeCircles = [];
    const activePolys = [];

    for (const z of zones) {
      if (z.isActive === false) continue;
      if (z.geofenceType === 'polygon' && z.polygonPath?.length > 2) {
        let minLat = Infinity,
          maxLat = -Infinity,
          minLng = Infinity,
          maxLng = -Infinity;
        for (const p of z.polygonPath) {
          if (p.lat < minLat) minLat = p.lat;
          if (p.lat > maxLat) maxLat = p.lat;
          if (p.lng < minLng) minLng = p.lng;
          if (p.lng > maxLng) maxLng = p.lng;
        }
        activePolys.push({ path: z.polygonPath, minLat, maxLat, minLng, maxLng });
      } else if (z.radiusMetres > 0 && Number.isFinite(z.lat) && Number.isFinite(z.lng)) {
        activeCircles.push({
          lat: z.lat,
          lng: z.lng,
          radiusMetres: z.radiusMetres,
          latDelta: z.radiusMetres / 111000,
          radiusSq: z.radiusMetres * z.radiusMetres,
        });
      }
    }

    for (const v of validLiveVehicles) {
      const vLat = v.lat;
      const vLng = v.lng;
      if (!Number.isFinite(vLat) || !Number.isFinite(vLng)) continue;
      const vId = v.vehicleId || v.registrationNumber;

      let inside = false;
      for (const c of activeCircles) {
        if (Math.abs(vLat - c.lat) > c.latDelta) continue;
        const dLat = (vLat - c.lat) * 111320;
        const dLng = (vLng - c.lng) * 111320 * Math.cos((vLat * Math.PI) / 180);
        if (dLat * dLat + dLng * dLng <= c.radiusSq) {
          inside = true;
          break;
        }
      }

      if (!inside) {
        for (const poly of activePolys) {
          if (
            vLat < poly.minLat ||
            vLat > poly.maxLat ||
            vLng < poly.minLng ||
            vLng > poly.maxLng
          ) {
            continue;
          }
          let inPoly = false;
          const pts = poly.path;
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i].lat,
              yi = pts[i].lng;
            const xj = pts[j].lat,
              yj = pts[j].lng;
            const intersect =
              yi > vLng !== yj > vLng && vLat < ((xj - xi) * (vLng - yi)) / (yj - yi) + xi;
            if (intersect) inPoly = !inPoly;
          }
          if (inPoly) {
            inside = true;
            break;
          }
        }
      }

      if (inside) {
        set.add(vId);
      }
    }

    return set;
  }, [validLiveVehicles, zones]);

  return (
    <PageShell
      className="gfz-page"
      title="Geofence Zones & Alerts"
      subtitle="Accident blackspots, parking areas, custom zones and crossing event alerts"
      count={activeTab === 'zones' ? filteredZones.length : filteredAlerts.length}
      actions={
        <>
          <Link to="/geofence" className="gfz-btn gfz-btn-ghost">
            <Compass size={14} /> Anomalies
          </Link>
          <Link to="/fleet-alerts" className="gfz-btn gfz-btn-ghost">
            <BellRing size={14} /> Fleet Alerts
          </Link>
          {activeTab === 'alerts' && unreadCount > 0 && (
            <button
              className="gfz-btn gfz-btn-ghost"
              onClick={handleMarkAllRead}
              title="Mark all alerts as read"
            >
              <CheckCheck size={14} color="#16a34a" /> Mark All Read
            </button>
          )}
          {import.meta.env.VITE_GEOFENCE_FLEETEDGE_ENABLED !== 'false' ? (
            <span
              className={`gfz-live-pill ${liveOnline ? (liveVehicles.some((v) => v.isStale) ? 'gfz-live-stale' : 'gfz-live-on') : 'gfz-live-off'}`}
            >
              {liveOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {liveOnline
                ? liveVehicles.some((v) => v.isStale)
                  ? 'Stale data'
                  : 'Live'
                : 'Offline'}
            </span>
          ) : (
            <span
              className="gfz-live-pill gfz-live-off"
              style={{ background: '#fef2f2', color: '#ef4444' }}
            >
              <WifiOff size={12} /> Live tracking disabled
            </span>
          )}
          {activeTab === 'zones' && (
            <>
              <button
                className={`gfz-btn gfz-btn-ghost gfz-bell-btn ${unreadCount > 0 ? 'gfz-bell-active' : ''}`}
                onClick={() => setShowAlerts((p) => !p)}
                title="Toggle quick alerts flyout"
              >
                {unreadCount > 0 ? <Bell size={15} /> : <BellOff size={15} />}
                Alerts
                {unreadCount > 0 && <span className="gfz-badge-count">{unreadCount}</span>}
              </button>
              <button
                className="gfz-btn gfz-btn-ghost"
                onClick={() => setShowUnknownTerritory(true)}
                title="Review unmapped dwell clusters and promote to zones"
              >
                <Compass size={14} /> Unknown Territory
                {pendingTerritoryCount > 0 && (
                  <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                    {pendingTerritoryCount}
                  </span>
                )}
              </button>
            </>
          )}
          <button
            className="gfz-btn gfz-btn-primary"
            onClick={() => {
              setClickedLatLng(null);
              setEditingZone(null);
              setShowDrawer(true);
            }}
          >
            <Plus size={14} /> Add Custom Zone
          </button>
          <button
            className="gfz-btn gfz-btn-ghost"
            onClick={() => {
              fetchZones();
              fetchAlerts();
            }}
            disabled={loading || alertLoading}
          >
            <RefreshCw size={14} className={loading || alertLoading ? 'gfz-spin' : ''} />
          </button>
        </>
      }
      filters={
        activeTab === 'zones' ? (
          <FilterBar
            searchValue={zoneQuery}
            onSearchChange={setZoneQuery}
            searchPlaceholder="Search zone name…"
            activeCount={zoneFilterCount}
            onClear={() => {
              setZoneQuery('');
              setTypeFilter('');
              setShowResolved(false);
            }}
            right={
              <ExportButton
                rows={zoneExportRows(filteredZones)}
                columns={ZONE_EXPORT_COLUMNS}
                filename="geofence-zones"
                disabled={loading || !!error}
                meta={{
                  generatedAt: new Date(),
                  filters: [
                    ...(zoneNeedle ? [{ label: 'Search', value: zoneQuery.trim() }] : []),
                    {
                      label: 'Zone type',
                      value: typeFilter
                        ? ZONE_CFG[typeFilter]?.label || humanise(typeFilter)
                        : 'All types',
                    },
                    { label: 'Status', value: showResolved ? 'Active + inactive' : 'Active only' },
                  ],
                }}
              />
            }
          />
        ) : (
          <FilterBar
            searchValue={alertQuery}
            onSearchChange={setAlertQuery}
            searchPlaceholder="Search vehicle number or zone…"
            activeCount={alertFilterCount}
            onClear={() => {
              setAlertQuery('');
              setAlertTypeFilter('');
              setAlertFilterUnreadOnly(false);
            }}
            right={
              <ExportButton
                rows={alertExportRows(filteredAlerts)}
                columns={ALERT_EXPORT_COLUMNS}
                filename="geofence-alerts"
                disabled={alertLoading}
                meta={{
                  generatedAt: new Date(),
                  filters: [
                    ...(alertNeedle ? [{ label: 'Search', value: alertQuery.trim() }] : []),
                    {
                      label: 'Zone type',
                      value: alertTypeFilter
                        ? ZONE_CFG[alertTypeFilter]?.label || humanise(alertTypeFilter)
                        : 'All types',
                    },
                    { label: 'Unread only', value: alertFilterUnreadOnly ? 'Yes' : 'No' },
                  ],
                }}
              />
            }
          />
        )
      }
      footer={
        activeTab === 'zones'
          ? footerSummary({
              showing: filteredZones.length,
              total: zones.length,
              activeFilters: zoneFilterCount,
            })
          : footerSummary({
              showing: filteredAlerts.length,
              total: alerts.length,
              activeFilters: alertFilterCount,
            })
      }
    >
      {/* View Switcher: Zones vs Zone Alerts vs Fuel Drain Map */}
      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('zones')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
            activeTab === 'zones'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <MapPin size={13} />
          <span>Zones &amp; Surveillance Map ({zones.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
            activeTab === 'alerts'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell size={13} />
          <span>Zone Alerts ({alerts.length})</span>
          {unreadCount > 0 && (
            <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
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
        <DrainHotspotMap
          mapLoaded={mapLoaded}
          onCreateZone={(zoneData) => {
            setClickedLatLng(zoneData);
            setShowDrawer(true);
          }}
        />
      )}

      {activeTab === 'zones' && (
        <>
          {error && (
            <div className="gfz-error mb-3">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
          {showAlerts && (
            <AlertPanel
              alerts={alerts}
              onMarkRead={handleMarkRead}
              onClose={() => setShowAlerts(false)}
            />
          )}

          {/* Persistent Framed Map Card with Enclosed KPI Strip & Legend */}
          <div className="hs-map-card">
            <div className="hs-map-head">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Geofence Risk Zones &amp; Live Surveillance
                </span>
              </div>

              {/* Enclosed KPI Rail */}
              <div className="hs-kpi-strip">
                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-rose-50 text-rose-600 border border-rose-200">
                    <AlertTriangle size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Accident Prone</span>
                    <span className="hs-kpi-pill-value">{formatNum(accidentCount)}</span>
                  </div>
                </div>

                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-amber-50 text-amber-600 border border-amber-200">
                    <ParkingCircle size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Parking / Rest</span>
                    <span className="hs-kpi-pill-value">{formatNum(parkingCount)}</span>
                  </div>
                </div>

                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-indigo-50 text-indigo-600 border border-indigo-200">
                    <MapPin size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Custom Zones</span>
                    <span className="hs-kpi-pill-value">{formatNum(customCount)}</span>
                  </div>
                </div>

                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Truck size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Live Fleet</span>
                    <span className="hs-kpi-pill-value">{formatNum(liveVehicles.length)}</span>
                  </div>
                </div>

                <div className="hs-kpi-pill">
                  <span
                    className={`hs-kpi-pill-icon ${unreadCount > 0 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}
                  >
                    <Bell size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Zone Alerts</span>
                    <span className={`hs-kpi-pill-value ${unreadCount > 0 ? 'text-rose-600' : ''}`}>
                      {unreadCount}
                    </span>
                  </div>
                </div>

                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <ShieldCheck size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Surveillance</span>
                    <span className="hs-kpi-pill-value text-emerald-700">Active</span>
                  </div>
                </div>
              </div>

              {/* Legend Group */}
              <div className="hs-legend-group">
                <span className="hs-legend-pill">
                  <span className="hs-legend-dot" style={{ background: '#ef4444' }} />
                  <span>Accident Prone</span>
                </span>
                <span className="hs-legend-pill">
                  <span className="hs-legend-dot" style={{ background: '#f59e0b' }} />
                  <span>Parking / Rest</span>
                </span>
                <span className="hs-legend-pill">
                  <span className="hs-legend-dot" style={{ background: '#6366f1' }} />
                  <span>Custom Zone</span>
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
                  <img src={GEOFENCE_BADGE_SVG} alt="icon" style={{ width: 12, height: 12 }} />
                  <span>In-Zone Halo</span>
                </span>
              </div>
            </div>

            {/* Ambient status ribbon bar (rendered below header so legend pills are never covered) */}
            {unreadCount > 0 ? (
              <div className="hs-status-strip hs-status-strip--amber">
                <div
                  className="hs-status-strip-badge"
                  style={{ borderColor: '#f59e0b', color: '#b45309' }}
                >
                  <AlertTriangle size={15} className="text-amber-600" />
                  <span>
                    {unreadCount} Active Zone Breach / Halt Alert{unreadCount !== 1 ? 's' : ''}{' '}
                    Requiring Review
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('alerts')}
                  className="inline-flex items-center gap-1 rounded-md bg-white border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-xs hover:bg-amber-100 transition cursor-pointer"
                >
                  Review Alerts Console &rarr;
                </button>
              </div>
            ) : (
              <div className="hs-status-strip hs-status-strip--emerald">
                <div
                  className="hs-status-strip-badge"
                  style={{ borderColor: '#10b981', color: '#065f46' }}
                >
                  <ShieldCheck size={15} className="text-emerald-600" />
                  <span>Corridors Clear · All Monitored Fleet Inside Authorized Corridors</span>
                </div>
              </div>
            )}

            {/* Main Map */}
            <div className="gfz-map-wrap" style={{ border: 'none', borderRadius: 0, margin: 0 }}>
              {mapLoaded ? (
                <GoogleMap
                  mapContainerClassName="gfz-map"
                  center={MAP_CENTER}
                  zoom={5}
                  options={MAP_OPTIONS}
                  onClick={handleMapClick}
                >
                  {memoizedZones.map((zone) => (
                    <React.Fragment key={zone._id}>
                      <MarkerF
                        position={zone.position}
                        icon={zone.markerIcon}
                        onClick={() => {
                          setSelectedZone(zone);
                          setSelectedVehicle(null);
                        }}
                      />
                      {(!zone.geofenceType || zone.geofenceType === 'circular') &&
                        zone.radiusMetres > 0 && (
                          <CircleF
                            center={zone.position}
                            radius={zone.radiusMetres}
                            options={zone.circleOptions}
                          />
                        )}
                      {zone.geofenceType === 'polygon' && zone.polygonPath?.length > 2 && (
                        <PolygonF paths={zone.polygonPath} options={zone.polygonOptions} />
                      )}
                    </React.Fragment>
                  ))}

                  {validLiveVehicles.map((v) => {
                    const vId = v.vehicleId || v.registrationNumber;
                    const inZone = inZoneVehicleIdSet.has(vId);
                    const iconUrl = vehicleIcons[v.status] || vehicleIcons.Offline;

                    return (
                      <React.Fragment key={vId}>
                        {inZone && haloIcon && (
                          <MarkerF
                            key={`halo-${vId}`}
                            position={{ lat: v.lat, lng: v.lng }}
                            icon={haloIcon}
                            zIndex={3}
                          />
                        )}
                        <MarkerF
                          position={{ lat: v.lat, lng: v.lng }}
                          icon={iconUrl}
                          zIndex={2}
                          onClick={() => {
                            setSelectedVehicle(v);
                            setSelectedZone(null);
                          }}
                        />
                      </React.Fragment>
                    );
                  })}

                  {selectedZone && (
                    <InfoWindowF
                      position={{ lat: selectedZone.lat, lng: selectedZone.lng }}
                      onCloseClick={() => setSelectedZone(null)}
                    >
                      <div className="gfz-infowindow">
                        <p className="gfz-iw-name">{selectedZone.name}</p>
                        <ZoneTypeBadge zoneType={selectedZone.zoneType} />
                        {selectedZone.radiusMetres > 0 && (
                          <p className="gfz-iw-meta">Radius: {selectedZone.radiusMetres}m</p>
                        )}
                        {selectedZone.state && (
                          <p className="gfz-iw-meta">{label('status', selectedZone.state)}</p>
                        )}
                        <p className="gfz-iw-meta">
                          Entry: {selectedZone.alertConfig?.alertOnEntry ? '✅' : '—'} &nbsp; Exit:{' '}
                          {selectedZone.alertConfig?.alertOnExit ? '✅' : '—'}
                        </p>
                      </div>
                    </InfoWindowF>
                  )}

                  {selectedVehicle && (
                    <InfoWindowF
                      position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                      onCloseClick={() => setSelectedVehicle(null)}
                    >
                      <div className="gfz-infowindow">
                        <p className="gfz-iw-name">
                          <Truck size={13} style={{ display: 'inline', marginRight: 4 }} />
                          {selectedVehicle.registrationNumber}
                        </p>
                        <p className="gfz-iw-meta">
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
                          <p className="gfz-iw-meta">
                            Speed: {selectedVehicle.speed?.toFixed(1)} kmph
                          </p>
                        )}
                        {selectedVehicle.fuelLevel != null && (
                          <p className="gfz-iw-meta">
                            Fuel: {selectedVehicle.fuelLevel?.toFixed(1)} L
                          </p>
                        )}
                        <p
                          className={`gfz-iw-meta gfz-iw-time ${selectedVehicle.isStale ? 'gfz-iw-stale' : ''}`}
                        >
                          {selectedVehicle.isStale ? '⚠️ Last seen ' : ''}
                          {fromNow(selectedVehicle.lastSeenAt)}
                          {selectedVehicle.isStale ? ' — FleetEdge token may be expired' : ''}
                        </p>
                      </div>
                    </InfoWindowF>
                  )}
                </GoogleMap>
              ) : (
                <div className="gfz-map-placeholder">
                  <RefreshCw size={18} className="gfz-spin" /> Loading map…
                </div>
              )}
              <p className="gfz-map-hint">
                💡 Click anywhere on the map to quickly add a custom zone at that location
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="gfz-filter-bar">
            <select
              className="gfz-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All zone types</option>
              <option value="ACCIDENT_PRONE">Accident Prone</option>
              <option value="PARKING">Parking / Rest</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <label className="gfz-check-label">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
              />
              Show inactive zones
            </label>
            <span className="gfz-count-label">
              {zones.length} zone{zones.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table */}
          {loading ? (
            <div className="gfz-loading">
              <RefreshCw size={18} className="gfz-spin" /> Loading zones…
            </div>
          ) : (
            <div className="gfz-table-wrap">
              <table className="gfz-table">
                <thead>
                  <tr>
                    <th className="gfz-th">Zone Name</th>
                    <th className="gfz-th gfz-th-c">Type</th>
                    <th className="gfz-th gfz-th-c">Shape</th>
                    <th className="gfz-th gfz-th-c">Radius</th>
                    <th className="gfz-th gfz-th-c">Entry Alert</th>
                    <th className="gfz-th gfz-th-c">Exit Alert</th>
                    <th className="gfz-th gfz-th-c">State / Highway</th>
                    <th className="gfz-th gfz-th-c">Status</th>
                    <th className="gfz-th gfz-th-c">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="gfz-empty-row">
                        No zones found. Run the seeder script or add a custom zone.
                      </td>
                    </tr>
                  ) : filteredZones.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="gfz-empty-row">
                        No zones match “{zoneQuery.trim()}”. Try another name or clear the search.
                      </td>
                    </tr>
                  ) : (
                    filteredZones.map((zone) => (
                      <tr key={zone._id} className="gfz-row">
                        <td className="gfz-td">
                          <span className="gfz-zone-name">{zone.name}</span>
                        </td>
                        <td className="gfz-td gfz-td-c">
                          <ZoneTypeBadge zoneType={zone.zoneType} />
                        </td>
                        <td className="gfz-td gfz-td-c">
                          <span className="gfz-shape-tag">
                            {zone.geofenceType === 'polygon' ? '⬡ Polygon' : '⊙ Circular'}
                          </span>
                        </td>
                        <td className="gfz-td gfz-td-c">
                          {zone.radiusMetres > 0 ? `${zone.radiusMetres}m` : '—'}
                        </td>
                        <td className="gfz-td gfz-td-c">
                          {zone.alertConfig?.alertOnEntry ? '✅' : '—'}
                        </td>
                        <td className="gfz-td gfz-td-c">
                          {zone.alertConfig?.alertOnExit ? '✅' : '—'}
                        </td>
                        <td className="gfz-td gfz-td-c gfz-meta-col">
                          {zone.state || '—'}
                          {zone.highway ? ` · ${zone.highway}` : ''}
                        </td>
                        <td className="gfz-td gfz-td-c">
                          <span
                            className={`gfz-status ${zone.isActive ? 'gfz-status-on' : 'gfz-status-off'}`}
                          >
                            {zone.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="gfz-td gfz-td-c">
                          {zone.zoneType === 'CUSTOM' ? (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                className="gfz-btn gfz-btn-ghost"
                                onClick={() => {
                                  setEditingZone(zone);
                                  setShowDrawer(true);
                                }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                className="gfz-btn gfz-btn-danger-ghost"
                                onClick={() => handleDelete(zone._id)}
                                disabled={deletingId === zone._id}
                              >
                                {deletingId === zone._id ? (
                                  <RefreshCw size={12} className="gfz-spin" />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="gfz-system-tag">System</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'alerts' && (
        <>
          {/* Zone Alerts Console View */}
          <div className="hs-map-card">
            <div className="hs-map-head">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-amber-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Geofence Crossing Alerts &amp; Event Stream
                </span>
              </div>

              {/* Enclosed KPI Rail */}
              <div className="hs-kpi-strip">
                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-sky-50 text-sky-600 border border-sky-200">
                    <Bell size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Total Alerts</span>
                    <span className="hs-kpi-pill-value">{formatNum(alerts.length)}</span>
                  </div>
                </div>

                <div className="hs-kpi-pill">
                  <span
                    className={`hs-kpi-pill-icon ${unreadCount > 0 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}
                  >
                    <AlertTriangle size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Unread</span>
                    <span
                      className={`hs-kpi-pill-value ${unreadCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}
                    >
                      {formatNum(unreadCount)}
                    </span>
                  </div>
                </div>

                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <LogIn size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Entry Events</span>
                    <span className="hs-kpi-pill-value">
                      {formatNum(alerts.filter((a) => a.eventType === 'ENTRY').length)}
                    </span>
                  </div>
                </div>

                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-amber-50 text-amber-600 border border-amber-200">
                    <LogOut size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Exit Events</span>
                    <span className="hs-kpi-pill-value">
                      {formatNum(alerts.filter((a) => a.eventType === 'EXIT').length)}
                    </span>
                  </div>
                </div>

                <div className="hs-kpi-pill">
                  <span className="hs-kpi-pill-icon bg-indigo-50 text-indigo-600 border border-indigo-200">
                    <MapPin size={12} />
                  </span>
                  <div className="hs-kpi-pill-meta">
                    <span className="hs-kpi-pill-label">Monitored Zones</span>
                    <span className="hs-kpi-pill-value">{formatNum(zones.length)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="gfz-filter-bar">
            <select
              className="gfz-select"
              value={alertTypeFilter}
              onChange={(e) => setAlertTypeFilter(e.target.value)}
            >
              <option value="">All zone types</option>
              <option value="ACCIDENT_PRONE">Accident Prone</option>
              <option value="PARKING">Parking / Rest</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <label className="gfz-check-label">
              <input
                type="checkbox"
                checked={alertFilterUnreadOnly}
                onChange={(e) => setAlertFilterUnreadOnly(e.target.checked)}
              />
              Unread alerts only
            </label>
            <span className="gfz-count-label">
              {unreadCount > 0
                ? `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up'}
            </span>
          </div>

          {alertLoading ? (
            <div className="gfz-loading">
              <RefreshCw size={18} className="gfz-spin" /> Loading zone alerts…
            </div>
          ) : (
            <div className="gfz-table-wrap">
              <table className="gfz-table">
                <thead>
                  <tr>
                    <th className="gfz-th">Timestamp</th>
                    <th className="gfz-th gfz-th-c">Vehicle</th>
                    <th className="gfz-th">Zone Name</th>
                    <th className="gfz-th gfz-th-c">Zone Type</th>
                    <th className="gfz-th gfz-th-c">Event Type</th>
                    <th className="gfz-th gfz-th-c">Speed</th>
                    <th className="gfz-th gfz-th-c">Status</th>
                    <th className="gfz-th gfz-th-c">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="gfz-empty-row">
                        {alertNeedle
                          ? `No alerts match "${alertQuery.trim()}"`
                          : 'No zone alerts recorded.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <tr
                        key={alert._id}
                        className={`gfz-row ${!alert.isRead ? 'gfz-row-unread' : ''}`}
                      >
                        <td className="gfz-td">
                          <div>
                            <span style={{ fontWeight: 600 }}>
                              {dayjs.utc(alert.createdAt).tz(IST).format('DD MMM YYYY, hh:mm A')}
                            </span>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                              {fromNow(alert.createdAt)}
                            </p>
                          </div>
                        </td>
                        <td className="gfz-td gfz-td-c">
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {alert.vehicleNumber || '—'}
                          </span>
                        </td>
                        <td className="gfz-td">
                          <span className="gfz-zone-name">{alert.zoneName || '—'}</span>
                        </td>
                        <td className="gfz-td gfz-td-c">
                          <ZoneTypeBadge zoneType={alert.zoneType} />
                        </td>
                        <td className="gfz-td gfz-td-c">
                          {alert.eventType === 'ENTRY' ? (
                            <span className="gfz-event-entry">
                              <LogIn size={11} /> Entry
                            </span>
                          ) : (
                            <span className="gfz-event-exit">
                              <LogOut size={11} /> Exit
                            </span>
                          )}
                        </td>
                        <td className="gfz-td gfz-td-c">
                          {alert.speedKmph != null ? `${alert.speedKmph.toFixed(0)} km/h` : '—'}
                        </td>
                        <td className="gfz-td gfz-td-c">
                          {!alert.isRead ? (
                            <span className="gfz-unread-badge">Unread</span>
                          ) : (
                            <span className="gfz-read-badge">Read</span>
                          )}
                        </td>
                        <td className="gfz-td gfz-td-c">
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            {!alert.isRead && (
                              <button
                                className="gfz-btn gfz-btn-ghost"
                                onClick={() => handleMarkRead(alert._id)}
                                title="Mark as read"
                                style={{ color: '#16a34a' }}
                              >
                                <CheckCircle2 size={14} />
                                <span>Mark read</span>
                              </button>
                            )}
                            <button
                              className="gfz-btn gfz-btn-ghost"
                              onClick={() => handleLocateZone(alert)}
                              title="Locate zone on map"
                            >
                              <Navigation size={13} />
                              <span>Map</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Zone Drawer */}
      {showDrawer && (
        <AddZoneDrawer
          prefillLatLng={clickedLatLng}
          editZone={editingZone}
          mode={editingZone ? 'edit' : 'add'}
          onClose={() => {
            setShowDrawer(false);
            setClickedLatLng(null);
            setEditingZone(null);
          }}
          onSaved={() => {
            setShowDrawer(false);
            setClickedLatLng(null);
            setEditingZone(null);
            fetchZones();
          }}
        />
      )}

      {/* Unknown Territory Learning Loop Drawer */}
      <UnknownTerritoryDrawer
        isOpen={showUnknownTerritory}
        onClose={() => setShowUnknownTerritory(false)}
        onZonePromoted={fetchZones}
      />
    </PageShell>
  );
};

export default GeofenceZonesPage;
