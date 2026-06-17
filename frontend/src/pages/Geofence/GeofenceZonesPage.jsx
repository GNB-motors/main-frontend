import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin, AlertTriangle, Plus, Trash2, RefreshCw, Bell, BellOff,
  CheckCircle2, ShieldAlert, ParkingCircle, X, Wifi, WifiOff, Truck,
} from 'lucide-react';
import {
  GoogleMap, useLoadScript, MarkerF, CircleF, InfoWindowF, PolygonF,
} from '@react-google-maps/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import AddZoneDrawer from './AddZoneDrawer.jsx';
import { GeofenceService } from '../../services/GeofenceService.jsx';
import './GeofenceZones.css';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// Static — prevents @react-google-maps/api performance warning
const GMAPS_LIBS = ['places'];

const IST     = 'Asia/Kolkata';
const fromNow  = (d) => (d ? dayjs.utc(d).tz(IST).fromNow() : '—');
const formatIST = (d) => (d ? dayjs.utc(d).tz(IST).format('DD MMM, hh:mm A') : '—');

const MAP_CENTER  = { lat: 22.5, lng: 82.0 };
const MAP_OPTIONS = {
  disableDefaultUI: false, zoomControl: true,
  streetViewControl: false, mapTypeControl: false, fullscreenControl: true,
};

const ZONE_CFG = {
  ACCIDENT_PRONE: { label: 'Accident Prone', color: '#ef4444', fill: '#ef444426', pin: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',    badgeCls: 'gfz-badge-danger'  },
  PARKING:        { label: 'Parking / Rest', color: '#f59e0b', fill: '#f59e0b26', pin: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png', badgeCls: 'gfz-badge-warning' },
  CUSTOM:         { label: 'Custom Zone',    color: '#6366f1', fill: '#6366f126', pin: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',   badgeCls: 'gfz-badge-info'    },
};
const VEHICLE_STATUS_COLOR = { Moving: '#22c55e', Stopped: '#94a3b8', Idling: '#f59e0b' };

const ZoneTypeBadge = ({ zoneType }) => {
  const cfg = ZONE_CFG[zoneType] || ZONE_CFG.CUSTOM;
  return <span className={`gfz-badge ${cfg.badgeCls}`}>{cfg.label}</span>;
};

const KpiCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className={`gfz-kpi gfz-kpi-${colorClass}`}>
    <div className="gfz-kpi-icon"><Icon size={18} /></div>
    <div>
      <p className="gfz-kpi-label">{label}</p>
      <p className="gfz-kpi-value">{value ?? 0}</p>
    </div>
  </div>
);

const AlertPanel = ({ alerts, onMarkRead, onClose }) => (
  <div className="gfz-alerts-panel">
    <div className="gfz-alerts-hdr">
      <ShieldAlert size={14} /> <span>Zone Alerts</span>
      <button className="gfz-btn gfz-btn-icon gfz-ml-auto" onClick={onClose}><X size={14} /></button>
    </div>
    {alerts.length === 0 ? (
      <div className="gfz-alerts-empty"><CheckCircle2 size={16} color="#22c55e" /> No unread alerts</div>
    ) : alerts.map(a => {
      const cfg = ZONE_CFG[a.zoneType] || ZONE_CFG.CUSTOM;
      return (
        <div key={a._id} className="gfz-alert-row">
          <div className="gfz-alert-dot" style={{ background: cfg.color }} />
          <div className="gfz-alert-body">
            <p className="gfz-alert-title">
              <strong>{a.vehicleNumber}</strong>
              &nbsp;{a.eventType === 'ENTRY' ? 'entered' : 'exited'}&nbsp;
              <strong>{a.zoneName}</strong>
              {a.speedKmph != null && <span className="gfz-alert-speed"> · {a.speedKmph} kmph</span>}
            </p>
            <p className="gfz-alert-time">{fromNow(a.createdAt)}</p>
          </div>
          <button className="gfz-btn gfz-btn-icon" onClick={() => onMarkRead(a._id)} title="Mark read">
            <CheckCircle2 size={13} color="#22c55e" />
          </button>
        </div>
      );
    })}
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
const GeofenceZonesPage = () => {
  const [zones,           setZones]           = useState([]);
  const [alerts,          setAlerts]          = useState([]);
  const [unreadCount,     setUnreadCount]     = useState(0);
  const [liveVehicles,    setLiveVehicles]    = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [typeFilter,      setTypeFilter]      = useState('');
  const [showResolved,    setShowResolved]    = useState(false);
  const [showDrawer,      setShowDrawer]      = useState(false);
  const [showAlerts,      setShowAlerts]      = useState(false);
  const [clickedLatLng,   setClickedLatLng]   = useState(null);
  const [selectedZone,    setSelectedZone]    = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [deletingId,      setDeletingId]      = useState(null);
  const [liveOnline,      setLiveOnline]      = useState(false);
  const liveIntervalRef   = useRef(null);

  const { isLoaded: mapLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GMAPS_LIBS,
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchZones = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { isActive: showResolved ? undefined : 'true', limit: 5000 };
      if (typeFilter) params.zoneType = typeFilter;
      const [zonesData, alertsData, count] = await Promise.all([
        GeofenceService.getZones(params),
        GeofenceService.getAlerts({ isRead: 'false', limit: 50 }),
        GeofenceService.getUnreadAlertCount(),
      ]);
      setZones(zonesData.zones || []);
      setAlerts(alertsData.alerts || []);
      setUnreadCount(count);
    } catch (err) {
      setError(err.message || 'Failed to load zones');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, showResolved]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  // ── Live locations (60s poll) ─────────────────────────────────────────────
  const fetchLiveLocations = useCallback(async () => {
    try {
      const vehicles = await GeofenceService.getLiveLocations();
      setLiveVehicles(vehicles); setLiveOnline(true);
    } catch { setLiveOnline(false); }
  }, []);

  useEffect(() => {
    fetchLiveLocations();
    liveIntervalRef.current = setInterval(fetchLiveLocations, 60_000);
    return () => clearInterval(liveIntervalRef.current);
  }, [fetchLiveLocations]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMapClick = (e) => {
    setClickedLatLng({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setShowDrawer(true);
  };

  const handleDelete = async (zoneId) => {
    if (!window.confirm('Delete this custom zone?')) return;
    setDeletingId(zoneId);
    try { await GeofenceService.deleteZone(zoneId); fetchZones(); }
    catch (err) { alert(err.message || 'Failed to delete'); }
    finally { setDeletingId(null); }
  };

  const handleMarkRead = async (alertId) => {
    await GeofenceService.markAlertsRead([alertId]);
    setAlerts(p => p.filter(a => a._id !== alertId));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const accidentCount = zones.filter(z => z.zoneType === 'ACCIDENT_PRONE').length;
  const parkingCount  = zones.filter(z => z.zoneType === 'PARKING').length;
  const customCount   = zones.filter(z => z.zoneType === 'CUSTOM').length;

  return (
    <div className="gfz-page">

      {/* Header */}
      <div className="gfz-header">
        <div className="gfz-title-area">
          <div className="gfz-icon-wrap"><MapPin size={20} color="var(--primary-color,#4f46e5)" /></div>
          <div>
            <h1 className="gfz-title">Geofence Zones</h1>
            <p className="gfz-subtitle">Accident blackspots, parking areas and custom zones · click the map to add a zone</p>
          </div>
        </div>
        <div className="gfz-header-actions">
          <span className={`gfz-live-pill ${liveOnline ? (liveVehicles.some(v => v.isStale) ? 'gfz-live-stale' : 'gfz-live-on') : 'gfz-live-off'}`}>
            {liveOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {liveOnline ? (liveVehicles.some(v => v.isStale) ? 'Stale data' : 'Live') : 'Offline'}
          </span>
          <button
            className={`gfz-btn gfz-btn-ghost gfz-bell-btn ${unreadCount > 0 ? 'gfz-bell-active' : ''}`}
            onClick={() => setShowAlerts(p => !p)}
          >
            {unreadCount > 0 ? <Bell size={15} /> : <BellOff size={15} />}
            Alerts
            {unreadCount > 0 && <span className="gfz-badge-count">{unreadCount}</span>}
          </button>
          <button className="gfz-btn gfz-btn-primary" onClick={() => { setClickedLatLng(null); setShowDrawer(true); }}>
            <Plus size={14} /> Add Custom Zone
          </button>
          <button className="gfz-btn gfz-btn-ghost" onClick={fetchZones} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'gfz-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="gfz-kpi-row">
        <KpiCard icon={AlertTriangle} label="Accident Blackspots"  value={accidentCount}       colorClass="danger"  />
        <KpiCard icon={ParkingCircle} label="Parking / Rest Stops" value={parkingCount}         colorClass="warning" />
        <KpiCard icon={MapPin}        label="Custom Zones"          value={customCount}          colorClass="info"    />
        <KpiCard icon={Truck}         label="Live Vehicles"         value={liveVehicles.length}  colorClass={liveOnline ? 'success' : 'muted'} />
        <KpiCard icon={Bell}          label="Unread Alerts"         value={unreadCount}          colorClass={unreadCount > 0 ? 'danger' : 'success'} />
      </div>

      {error && <div className="gfz-error"><AlertTriangle size={14} /> {error}</div>}
      {showAlerts && <AlertPanel alerts={alerts} onMarkRead={handleMarkRead} onClose={() => setShowAlerts(false)} />}

      {/* Filters */}
      <div className="gfz-filter-bar">
        <select className="gfz-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All zone types</option>
          <option value="ACCIDENT_PRONE">Accident Prone</option>
          <option value="PARKING">Parking / Rest</option>
          <option value="CUSTOM">Custom</option>
        </select>
        <label className="gfz-check-label">
          <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} />
          Show inactive zones
        </label>
        <span className="gfz-count-label">{zones.length} zone{zones.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Main Map */}
      <div className="gfz-map-wrap">
        {mapLoaded ? (
          <GoogleMap
            mapContainerClassName="gfz-map"
            center={MAP_CENTER} zoom={5}
            options={MAP_OPTIONS}
            onClick={handleMapClick}
          >
            {zones.map(zone => {
              const cfg = ZONE_CFG[zone.zoneType] || ZONE_CFG.CUSTOM;
              return (
                <React.Fragment key={zone._id}>
                  <MarkerF
                    position={{ lat: zone.lat, lng: zone.lng }}
                    icon={{ url: cfg.pin }}
                    onClick={() => { setSelectedZone(zone); setSelectedVehicle(null); }}
                  />
                  {(!zone.geofenceType || zone.geofenceType === 'circular') && zone.radiusMetres > 0 && (
                    <CircleF
                      center={{ lat: zone.lat, lng: zone.lng }}
                      radius={zone.radiusMetres}
                      options={{ strokeColor: cfg.color, strokeOpacity: 0.85, strokeWeight: 2, fillColor: cfg.fill, fillOpacity: 1 }}
                    />
                  )}
                  {zone.geofenceType === 'polygon' && zone.polygonPath?.length > 2 && (
                    <PolygonF
                      paths={zone.polygonPath}
                      options={{ strokeColor: cfg.color, strokeOpacity: 0.85, strokeWeight: 2, fillColor: cfg.fill, fillOpacity: 1 }}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {liveVehicles.map(v => {
              const color = v.isStale
                ? '#94a3b8'
                : (VEHICLE_STATUS_COLOR[v.status] || '#94a3b8');
              return (
                <MarkerF
                  key={v.vehicleId || v.registrationNumber}
                  position={{ lat: v.lat, lng: v.lng }}
                  icon={{
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.27 0 0 6.27 0 14c0 9.75 14 22 14 22s14-12.25 14-22C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/><circle cx="14" cy="14" r="5" fill="white"/></svg>`)}`,
                    scaledSize: { width: 28, height: 36 },
                    anchor: { x: 14, y: 36 },
                  }}
                  onClick={() => { setSelectedVehicle(v); setSelectedZone(null); }}
                />
              );
            })}

            {selectedZone && (
              <InfoWindowF position={{ lat: selectedZone.lat, lng: selectedZone.lng }} onCloseClick={() => setSelectedZone(null)}>
                <div className="gfz-infowindow">
                  <p className="gfz-iw-name">{selectedZone.name}</p>
                  <ZoneTypeBadge zoneType={selectedZone.zoneType} />
                  {selectedZone.radiusMetres > 0 && <p className="gfz-iw-meta">Radius: {selectedZone.radiusMetres}m</p>}
                  {selectedZone.state && <p className="gfz-iw-meta">{selectedZone.state}</p>}
                  <p className="gfz-iw-meta">
                    Entry: {selectedZone.alertConfig?.alertOnEntry ? '✅' : '—'} &nbsp;
                    Exit: {selectedZone.alertConfig?.alertOnExit ? '✅' : '—'}
                  </p>
                </div>
              </InfoWindowF>
            )}

            {selectedVehicle && (
              <InfoWindowF position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }} onCloseClick={() => setSelectedVehicle(null)}>
                <div className="gfz-infowindow">
                  <p className="gfz-iw-name"><Truck size={13} style={{ display:'inline', marginRight:4 }} />{selectedVehicle.registrationNumber}</p>
                  <p className="gfz-iw-meta">Status: <strong style={{ color: VEHICLE_STATUS_COLOR[selectedVehicle.status] || '#64748b' }}>{selectedVehicle.status || 'Unknown'}</strong></p>
                  {selectedVehicle.speed != null && <p className="gfz-iw-meta">Speed: {selectedVehicle.speed?.toFixed(1)} kmph</p>}
                  {selectedVehicle.fuelLevel != null && <p className="gfz-iw-meta">Fuel: {selectedVehicle.fuelLevel?.toFixed(1)} L</p>}
                  <p className={`gfz-iw-meta gfz-iw-time ${selectedVehicle.isStale ? 'gfz-iw-stale' : ''}`}>
                    {selectedVehicle.isStale ? '⚠️ Last seen ' : ''}
                    {fromNow(selectedVehicle.lastSeenAt)}
                    {selectedVehicle.isStale ? ' — FleetEdge token may be expired' : ''}
                  </p>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          <div className="gfz-map-placeholder"><RefreshCw size={18} className="gfz-spin" /> Loading map…</div>
        )}
        <p className="gfz-map-hint">💡 Click anywhere on the map to quickly add a custom zone at that location</p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="gfz-loading"><RefreshCw size={18} className="gfz-spin" /> Loading zones…</div>
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
                <tr><td colSpan={9} className="gfz-empty-row">No zones found. Run the seeder script or add a custom zone.</td></tr>
              ) : zones.map(zone => (
                <tr key={zone._id} className="gfz-row">
                  <td className="gfz-td"><span className="gfz-zone-name">{zone.name}</span></td>
                  <td className="gfz-td gfz-td-c"><ZoneTypeBadge zoneType={zone.zoneType} /></td>
                  <td className="gfz-td gfz-td-c"><span className="gfz-shape-tag">{zone.geofenceType === 'polygon' ? '⬡ Polygon' : '⊙ Circular'}</span></td>
                  <td className="gfz-td gfz-td-c">{zone.radiusMetres > 0 ? `${zone.radiusMetres}m` : '—'}</td>
                  <td className="gfz-td gfz-td-c">{zone.alertConfig?.alertOnEntry ? '✅' : '—'}</td>
                  <td className="gfz-td gfz-td-c">{zone.alertConfig?.alertOnExit  ? '✅' : '—'}</td>
                  <td className="gfz-td gfz-td-c gfz-meta-col">{zone.state || '—'}{zone.highway ? ` · ${zone.highway}` : ''}</td>
                  <td className="gfz-td gfz-td-c">
                    <span className={`gfz-status ${zone.isActive ? 'gfz-status-on' : 'gfz-status-off'}`}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="gfz-td gfz-td-c">
                    {zone.zoneType === 'CUSTOM' ? (
                      <button className="gfz-btn gfz-btn-danger-ghost" onClick={() => handleDelete(zone._id)} disabled={deletingId === zone._id}>
                        {deletingId === zone._id ? <RefreshCw size={12} className="gfz-spin" /> : <Trash2 size={13} />}
                      </button>
                    ) : <span className="gfz-system-tag">System</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Zone Drawer */}
      {showDrawer && (
        <AddZoneDrawer
          prefillLatLng={clickedLatLng}
          onClose={() => { setShowDrawer(false); setClickedLatLng(null); }}
          onSaved={() => { setShowDrawer(false); setClickedLatLng(null); fetchZones(); }}
        />
      )}

    </div>
  );
};

export default GeofenceZonesPage;