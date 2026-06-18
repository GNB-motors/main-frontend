import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin, AlertTriangle, CheckCircle2, RefreshCw,
  ChevronDown, ChevronUp, Fuel, Clock, Truck, ShieldAlert, XCircle,
  Wifi, WifiOff
} from 'lucide-react';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { GeofenceService } from '../../services/GeofenceService.jsx';
import './Geofence.css';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const IST = 'Asia/Kolkata';
const formatIST = (d) => (d ? dayjs.utc(d).tz(IST).format('DD MMM YYYY, hh:mm A') : '—');
const fromNow = (d) => (d ? dayjs.utc(d).tz(IST).fromNow() : '—');

const MAP_CENTER  = { lat: 22.5, lng: 82.0 };
const MAP_OPTIONS = { disableDefaultUI: false, zoomControl: true, streetViewControl: false, mapTypeControl: false };
const FLEET_EDGE_ICONS = {
  Moving: 'https://d1mk50hnhgdjj6.cloudfront.net/production/assets/vehicle/vehicle_images/MovingTruckV2.svg',
  Stopped: 'https://d1mk50hnhgdjj6.cloudfront.net/production/assets/vehicle/vehicle_images/StoppedTruckV2.svg',
  Idling: 'https://d1mk50hnhgdjj6.cloudfront.net/production/assets/vehicle/vehicle_images/IdlingTruckV2.svg',
  Offline: 'https://d1mk50hnhgdjj6.cloudfront.net/production/assets/vehicle/vehicle_images/OfflineTruckV2.svg',
  Breakdown: 'https://d1mk50hnhgdjj6.cloudfront.net/production/assets/vehicle/vehicle_images/StoppedTruckV2.svg',
  Faulty: 'https://d1mk50hnhgdjj6.cloudfront.net/production/assets/vehicle/vehicle_images/OfflineTruckV2.svg'
};

const VEHICLE_STATUS_COLOR = {
  Moving: '#22c55e',       // green
  Stopped: '#8b5cf6',      // purple
  Idling: '#f59e0b',       // yellowish-orange
  Offline: '#94a3b8',      // grey
  Breakdown: '#ef4444',    // red
  Faulty: '#84cc16'        // sieve green
};

// ─── Severity Badge ────────────────────────────────────────────────────────────
const SeverityBadge = ({ severity }) => {
  const map = {
    HIGH:   { cls: 'gf-badge gf-badge-high',   label: 'High' },
    MEDIUM: { cls: 'gf-badge gf-badge-medium', label: 'Medium' },
    LOW:    { cls: 'gf-badge gf-badge-low',    label: 'Low' },
  };
  const cfg = map[severity] || map.LOW;
  return <span className={cfg.cls}>{cfg.label}</span>;
};

// ─── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className={`gf-kpi-card gf-kpi-${colorClass}`}>
    <div className="gf-kpi-icon-wrap"><Icon size={20} /></div>
    <div className="gf-kpi-content">
      <span className="gf-kpi-label">{label}</span>
      <span className="gf-kpi-value">{value ?? 0}</span>
    </div>
  </div>
);

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
        {event.driverId?.name && (
          <span className="gf-event-driver">· {event.driverId.name}</span>
        )}
      </div>
      <div className="gf-event-meta">
        <Clock size={11} />
        <span>{formatIST(event.stoppedAt)} → {formatIST(event.departedAt)}</span>
        <span className="gf-sep">·</span>
        <span>{event.durationMinutes?.toFixed(0)} min stop</span>
        <span className="gf-sep">·</span>
        <span className="gf-fuel-drop"><Fuel size={11} /> −{event.fuelDropLitres?.toFixed(1)} L</span>
      </div>
    </div>
  </div>
);

// ─── Map Legend ────────────────────────────────────────────────────────────────
const LegendItem = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#475569', fontWeight: 500 }}>
    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }}></div>
    {label}
  </div>
);

const MapLegend = () => (
  <div style={{
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
    padding: '10px 16px', background: 'white', border: '1px solid #e2e8f0',
    borderRadius: '8px', marginBottom: '16px', fontSize: '12px'
  }}>
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
const LocationRow = ({ location, onResolve, resolvingId }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr className={`gf-row ${location.severity === 'HIGH' ? 'gf-row-high' : ''}`}>
        <td className="gf-td">
          <div className="gf-location-cell">
            <MapPin size={13} className="gf-pin-icon" />
            <span className="gf-address">
              {location.address || `${location.lat?.toFixed(5)}, ${location.lng?.toFixed(5)}`}
            </span>
          </div>
        </td>
        <td className="gf-td gf-td-c"><SeverityBadge severity={location.severity} /></td>
        <td className="gf-td gf-td-c">{location.occurrenceCount}</td>
        <td className="gf-td gf-td-r">{location.totalFuelDropLitres?.toFixed(1)} L</td>
        <td className="gf-td gf-td-c">{(location.vehiclesAffected || []).length}</td>
        <td className="gf-td gf-td-c">{formatIST(location.lastSeenAt)}</td>
        <td className="gf-td gf-td-actions">
          <button className="gf-btn gf-btn-icon" onClick={() => setExpanded(p => !p)}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {!location.isResolved && (
            <button
              className="gf-btn gf-btn-resolve"
              onClick={() => onResolve(location._id)}
              disabled={resolvingId === location._id}
            >
              {resolvingId === location._id
                ? <RefreshCw size={12} className="gf-spin" />
                : <CheckCircle2 size={12} />}
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
                &nbsp;{(location.events || []).length} suspicious stop{(location.events || []).length !== 1 ? 's' : ''} at this location
              </p>
              {(location.events || []).map((ev, i) => <EventRow key={i} event={ev} idx={i} />)}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const PIN = {
  HIGH:   'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  MEDIUM: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  LOW:    'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const GeofencePage = () => {
  const [locations,    setLocations]    = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [severityFilter, setSeverityFilter] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [resolvingId,  setResolvingId]  = useState(null);
  const [selectedLoc,  setSelectedLoc]  = useState(null);
  
  // Live vehicles state
  const [liveVehicles, setLiveVehicles] = useState([]);
  const [liveOnline, setLiveOnline] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const liveIntervalRef = useRef(null);
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

  useEffect(() => { fetchData(); }, [fetchData]);

  // Live location polling (5s for real-time feel)
  const fetchLiveLocations = useCallback(async () => {
    try {
      const vehicles = await GeofenceService.getLiveLocations();
      setLiveVehicles(vehicles); setLiveOnline(true);
    } catch { setLiveOnline(false); }
  }, []);

  useEffect(() => {
    fetchLiveLocations();
    liveIntervalRef.current = setInterval(fetchLiveLocations, 5000);
    return () => clearInterval(liveIntervalRef.current);
  }, [fetchLiveLocations]);

  // Fit bounds when data changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    // Only fit bounds if we have either locations or vehicles
    if (locations.length === 0 && liveVehicles.length === 0) return;
    
    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    locations.forEach(loc => {
      if (loc.lat && loc.lng) {
        bounds.extend({ lat: loc.lat, lng: loc.lng });
        hasPoints = true;
      }
    });

    liveVehicles.forEach(v => {
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
      alert(err.message || 'Failed to resolve');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="gf-page">
      {/* Header */}
      <div className="gf-header-bar">
        <div className="gf-title-area">
          <div className="gf-icon-wrap"><MapPin size={22} color="var(--primary-color,#4f46e5)" /></div>
          <div>
            <h1 className="gf-title">Geofence Anomalies</h1>
            <p className="gf-subtitle">Locations where vehicles stopped and unexplained fuel was lost</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 10px', borderRadius: '12px', background: liveOnline ? '#ecfdf5' : '#f1f5f9', color: liveOnline ? '#059669' : '#64748b', fontWeight: 500 }}>
            {liveOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {liveOnline ? 'Live' : 'Offline'}
          </span>
          <button className="gf-btn gf-btn-ghost" onClick={fetchData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'gf-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Row */}
      {stats && (
        <div className="gf-kpi-row">
          <KpiCard icon={AlertTriangle}  label="Open Anomalies"  value={stats.total}    colorClass="warning" />
          <KpiCard icon={XCircle}        label="High Severity"   value={stats.high}     colorClass="danger"  />
          <KpiCard icon={ShieldAlert}    label="Medium"          value={stats.medium}   colorClass="orange"  />
          <KpiCard icon={MapPin}         label="Low"             value={stats.low}      colorClass="info"    />
          <KpiCard icon={CheckCircle2}   label="Resolved"        value={stats.resolved} colorClass="success" />
        </div>
      )}

      {/* Map */}
      <MapLegend />
      <div className="gf-map-wrap">
        {mapLoaded ? (
          <GoogleMap
            mapContainerClassName="gf-map"
            center={MAP_CENTER}
            zoom={5}
            options={MAP_OPTIONS}
            onLoad={map => { mapRef.current = map; }}
          >
            {locations.map(loc => (
              <MarkerF
                key={loc._id}
                position={{ lat: loc.lat, lng: loc.lng }}
                icon={{ url: PIN[loc.severity] || PIN.LOW }}
                onClick={() => { setSelectedLoc(loc); setSelectedVehicle(null); }}
              />
            ))}
            {/* Live vehicle pins */}
            {liveVehicles.map(v => {
              const iconUrl = FLEET_EDGE_ICONS[v.status] || FLEET_EDGE_ICONS.Offline;
              return (
              <MarkerF
                key={v.vehicleId}
                position={{ lat: v.lat, lng: v.lng }}
                icon={{
                  url: iconUrl,
                  scaledSize: new window.google.maps.Size(32, 54),
                  anchor: new window.google.maps.Point(16, 27)
                }}
                zIndex={2}
                onClick={() => { setSelectedVehicle(v); setSelectedLoc(null); }}
              />
            )})}
            {selectedLoc && (
              <InfoWindowF
                position={{ lat: selectedLoc.lat, lng: selectedLoc.lng }}
                onCloseClick={() => setSelectedLoc(null)}
              >
                <div className="gf-infowindow">
                  <p className="gf-iw-title">
                    {selectedLoc.address || `${selectedLoc.lat?.toFixed(5)}, ${selectedLoc.lng?.toFixed(5)}`}
                  </p>
                  <p className="gf-iw-stat">
                    <strong>{selectedLoc.occurrenceCount}</strong> occurrence{selectedLoc.occurrenceCount !== 1 ? 's' : ''}
                    &nbsp;·&nbsp;<strong>{selectedLoc.totalFuelDropLitres?.toFixed(1)} L</strong> total drop
                  </p>
                  <SeverityBadge severity={selectedLoc.severity} />
                </div>
              </InfoWindowF>
            )}
            {selectedVehicle && (
              <InfoWindowF position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }} onCloseClick={() => setSelectedVehicle(null)}>
                <div className="gf-infowindow">
                  <p className="gf-iw-title"><Truck size={13} style={{ display: 'inline', marginRight: 4 }} />{selectedVehicle.registrationNumber}</p>
                  <p className="gf-iw-stat">Status: <strong style={{ color: VEHICLE_STATUS_COLOR[selectedVehicle.status] || '#64748b' }}>{selectedVehicle.status || 'Unknown'}</strong></p>
                  {selectedVehicle.speed != null && <p className="gf-iw-stat">Speed: {selectedVehicle.speed?.toFixed(1)} kmph</p>}
                  {selectedVehicle.fuelLevel != null && <p className="gf-iw-stat">Fuel: {selectedVehicle.fuelLevel?.toFixed(1)} L</p>}
                  <p className="gf-iw-stat" style={{ color: '#64748b', fontSize: '11px', marginTop: 4 }}>{fromNow(selectedVehicle.lastSeenAt)}</p>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          <div className="gf-map-placeholder"><RefreshCw size={18} className="gf-spin" /><span>Loading map…</span></div>
        )}
      </div>

      {/* Filters */}
      <div className="gf-filter-bar">
        <select className="gf-select" value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}>
          <option value="">All severities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <label className="gf-check-label">
          <input type="checkbox" checked={showResolved} onChange={e => { setShowResolved(e.target.checked); setPage(1); }} />
          Show resolved
        </label>
        <span className="gf-count-label">{stats ? `${stats.total} open location${stats.total !== 1 ? 's' : ''}` : ''}</span>
      </div>

      {error && <div className="gf-error-banner"><AlertTriangle size={15} /> {error}</div>}

      {/* Table */}
      {loading ? (
        <div className="gf-loading"><RefreshCw size={20} className="gf-spin" /><span>Analysing locations…</span></div>
      ) : locations.length === 0 ? (
        <div className="gf-empty">
          <CheckCircle2 size={40} color="#22c55e" />
          <p>No suspicious locations detected.</p>
          <span>Anomalies appear here after mileage intervals are computed from FleetEdge data.</span>
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
              {locations.map(loc => (
                <LocationRow key={loc._id} location={loc} onResolve={handleResolve} resolvingId={resolvingId} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="gf-pagination">
          <button className="gf-btn gf-btn-page" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
          <span className="gf-page-label">Page {page} of {totalPages}</span>
          <button className="gf-btn gf-btn-page" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
        </div>
      )}
    </div>
  );
};

export default GeofencePage;