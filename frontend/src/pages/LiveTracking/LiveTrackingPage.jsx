import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF, PolylineF } from '@react-google-maps/api';
import {
  Navigation,
  AlertTriangle,
  RefreshCw,
  Truck,
  WifiOff,
  CircleParking,
  Loader2,
} from 'lucide-react';
import { LiveTrackingService } from './LiveTrackingService.jsx';
import {
  INDIA_CENTER,
  IST_ZONE,
  getStateMeta,
  formatIST,
  formatRelativeIST,
  pinIcon,
} from './liveTracking.shared.js';
import { useLivePositions } from '../../hooks/useLivePositions';
import { getThemeCSS } from '../../utils/colorTheme';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import ExportButton from '../../components/ui/ExportButton';
import { footerSummary } from '../../lib/tableState';
import '../FuelComparison/FuelComparison.css';
import './LiveTracking.css';

const MAP_CONTAINER_STYLE = { width: '100%', height: '560px', borderRadius: '0.75rem' };
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const VEHICLE_EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: 'Registration' },
  { key: 'status', label: 'Status' },
  { key: 'speedKmph', label: 'Speed (km/h)', type: 'number' },
  { key: 'lastUpdate', label: 'Last update' },
];

const KpiCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className={`fc-kpi-card fc-kpi-${colorClass}`}>
    <div className="fc-kpi-icon-wrap">{Icon ? <Icon size={20} /> : null}</div>
    <div className="fc-kpi-content">
      <span className="fc-kpi-label">{label}</span>
      <span className="fc-kpi-value">{value}</span>
    </div>
  </div>
);

const LiveTrackingPage = () => {
  const [themeColors] = useState(getThemeCSS());
  // Live positions arrive by SSE when the stream is up and by REST poll when it
  // isn't — useLivePositions owns that choice, so this page no longer times its
  // own fetches (Workstream A).
  const { positions, isLoading, error: liveError, lastEventAt, refresh } = useLivePositions();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const error = liveError ? liveError.detail || 'Could not load live positions.' : null;

  const [selectedReg, setSelectedReg] = useState(null);
  const [trail, setTrail] = useState([]);
  const [trailLoading, setTrailLoading] = useState(false);
  const [trailError, setTrailError] = useState(null);
  // Set when the server capped the trail: how many points the window really
  // held and how far back the returned ones reach — "Trail: N points" used to
  // silently mean "the oldest N".
  const [trailTruncated, setTrailTruncated] = useState(null);
  // Display-only corridor-matched path (dashed on the map): same observed
  // fixes projected onto learned corridors where one lies within ~150 m.
  const [snapPath, setSnapPath] = useState([]);
  const [vehicleQuery, setVehicleQuery] = useState('');

  const mapRef = useRef(null);
  const fetchInFlightRef = useRef(false);
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  // Manual refresh keeps its own spinner: the hook reports `loading` only for
  // the first fetch, so a user-triggered refresh would otherwise show nothing.
  const handleRefresh = useCallback(async () => {
    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      fetchInFlightRef.current = false;
      setIsRefreshing(false);
    }
  }, [refresh]);

  // Fetch the traveled trail whenever the selected vehicle changes.
  useEffect(() => {
    if (!selectedReg) {
      setTrail([]);
      setTrailError(null);
      setTrailTruncated(null);
      setSnapPath([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setTrailLoading(true);
      setTrailError(null);
      try {
        const data = await LiveTrackingService.getTrail(selectedReg, { snap: 'corridor' });
        if (cancelled) return;
        setTrailTruncated(
          data.truncated ? { totalCount: data.totalCount, coveredTo: data.coveredTo } : null,
        );
        setSnapPath(
          (data.snap?.path || [])
            .filter((p) => p.provenance === 'snapped')
            .map((p) => ({ lat: p.lat, lng: p.lng })),
        );
        const points = (data.points || [])
          .filter((p) => p.latitude != null && p.longitude != null)
          .map((p) => ({ lat: p.latitude, lng: p.longitude }));
        setTrail(points);
        if (points.length > 1 && mapRef.current && window.google) {
          const bounds = new window.google.maps.LatLngBounds();
          points.forEach((p) => bounds.extend(p));
          mapRef.current.fitBounds(bounds, 60);
        }
      } catch (err) {
        if (!cancelled) {
          setTrail([]);
          setTrailError(err.detail || 'Could not load the vehicle trail.');
          setTrailTruncated(null);
          setSnapPath([]);
        }
      } finally {
        if (!cancelled) setTrailLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedReg]);

  const located = positions.filter((p) => p.latitude != null && p.longitude != null);
  const activeCount = positions.filter((p) => p.state === 'ACTIVE').length;
  const parkedCount = positions.filter((p) => p.state === 'PARKED').length;
  const offlineCount = positions.filter((p) => p.state === 'OFFLINE').length;
  const selectedVehicle = positions.find((p) => p.registrationNumber === selectedReg) || null;

  // Client-side search over the whole fleet — the positions payload IS the
  // entire fleet, so filtering it loses nothing.
  const needle = vehicleQuery.trim().toLowerCase();
  const filteredPositions = useMemo(() => {
    if (!needle) return positions;
    return positions.filter((v) =>
      [v.registrationNumber, v.vin, getStateMeta(v.state).label].some((f) =>
        String(f ?? '')
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [positions, needle]);

  const vehicleExportRows = filteredPositions.map((v) => ({
    registrationNumber: v.registrationNumber || v.vin || '—',
    status: `${getStateMeta(v.state).label}${v.isStale ? ' (stale)' : ''}`,
    speedKmph: v.speed != null ? Math.round(v.speed) : null,
    lastUpdate: v.eventDateTime ? formatIST(v.eventDateTime) : '—',
  }));

  return (
    <div className="fc-page" style={themeColors}>
      <PageShell
        title="Live Tracking"
        subtitle="Latest vehicle positions — streamed live, falling back to a 45s refresh"
        count={`${filteredPositions.length}/${positions.length}`}
        freshnessAt={lastEventAt}
        actions={
          <>
            {lastEventAt && (
              <span className="lt-last-poll">
                Updated{' '}
                {lastEventAt.toLocaleTimeString('en-IN', { hour12: true, timeZone: IST_ZONE })} IST
              </span>
            )}
            <button
              className="fc-btn fc-btn-icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh"
            >
              {isRefreshing ? <Loader2 size={18} className="fc-spin" /> : <RefreshCw size={18} />}
            </button>
          </>
        }
        filters={
          <FilterBar
            searchValue={vehicleQuery}
            onSearchChange={setVehicleQuery}
            searchPlaceholder="Search registration or status…"
            activeCount={needle ? 1 : 0}
            onClear={() => setVehicleQuery('')}
            right={
              <ExportButton
                rows={vehicleExportRows}
                columns={VEHICLE_EXPORT_COLUMNS}
                filename="live-vehicles"
                meta={{
                  generatedAt: new Date(),
                  filters: [
                    ...(needle ? [{ label: 'Search', value: vehicleQuery.trim() }] : []),
                    {
                      label: 'Fleet',
                      value: `${filteredPositions.length} of ${positions.length} vehicles`,
                    },
                  ],
                }}
              />
            }
          />
        }
        footer={footerSummary({
          showing: filteredPositions.length,
          total: positions.length,
          activeFilters: needle ? 1 : 0,
        })}
      >
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* KPI strip */}
        <div className="fc-metrics-row">
          <KpiCard icon={Truck} label="Active" value={activeCount} colorClass="success" />
          <KpiCard icon={CircleParking} label="Parked" value={parkedCount} colorClass="warning" />
          <KpiCard icon={WifiOff} label="Offline" value={offlineCount} colorClass="nodata" />
          <KpiCard
            icon={Navigation}
            label="Vehicles tracked"
            value={positions.length}
            colorClass="pending"
          />
        </div>

        <div className="lt-layout">
          {/* Vehicle list */}
          <div className="fc-content-card lt-list-card">
            <div className="lt-list-header">Vehicles</div>
            {isLoading ? (
              <div className="fc-loading-state">
                <Loader2 size={28} className="fc-spin" />
                <p>Loading live positions...</p>
              </div>
            ) : positions.length === 0 ? (
              <div className="fc-empty-state">
                No live positions yet. The backend live-tracking poll populates this.
              </div>
            ) : filteredPositions.length === 0 ? (
              <div className="fc-empty-state">
                No vehicles match “{vehicleQuery.trim()}”. Try another registration or status.
              </div>
            ) : (
              <ul className="lt-vehicle-list">
                {filteredPositions.map((v) => {
                  const meta = getStateMeta(v.state);
                  const isSelected = v.registrationNumber === selectedReg;
                  return (
                    <li key={v.registrationNumber || v.vin}>
                      <button
                        type="button"
                        className={`lt-vehicle-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedReg(isSelected ? null : v.registrationNumber)}
                      >
                        <span className="lt-state-dot" style={{ backgroundColor: meta.color }} />
                        <span className="lt-vehicle-main">
                          <span className="lt-vehicle-reg">
                            {v.registrationNumber || v.vin || '—'}
                          </span>
                          <span className="lt-vehicle-sub">
                            {meta.label}
                            {v.isStale ? ' · stale' : ''}
                            {v.eventDateTime
                              ? ` · ${formatRelativeIST(v.eventDateTime) || formatIST(v.eventDateTime)}`
                              : ''}
                          </span>
                        </span>
                        {v.state === 'ACTIVE' && v.speed != null && (
                          <span className="lt-vehicle-speed">{Math.round(v.speed)} km/h</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Map */}
          <div className="fc-content-card lt-map-card">
            {!isLoaded ? (
              <div className="fc-loading-state" style={{ height: MAP_CONTAINER_STYLE.height }}>
                <Loader2 size={28} className="fc-spin" />
                <p>Loading map...</p>
              </div>
            ) : located.length === 0 && !isLoading ? (
              <div className="fc-empty-state" style={{ height: MAP_CONTAINER_STYLE.height }}>
                No vehicles with coordinates right now.
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={
                  located.length === 1
                    ? { lat: located[0].latitude, lng: located[0].longitude }
                    : INDIA_CENTER
                }
                zoom={located.length === 1 ? 12 : 5}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                }}
              >
                {located.map((v) => {
                  const meta = getStateMeta(v.state);
                  return (
                    <MarkerF
                      key={v.registrationNumber || v.vin}
                      position={{ lat: v.latitude, lng: v.longitude }}
                      title={v.registrationNumber || v.vin}
                      icon={pinIcon(meta.color, v.isStale || v.state === 'OFFLINE')}
                      onClick={() => setSelectedReg(v.registrationNumber)}
                    />
                  );
                })}

                {/* Traveled path of the selected vehicle (oldest-first) */}
                {trail.length > 1 && (
                  <PolylineF
                    path={trail}
                    options={{ strokeColor: '#2563EB', strokeOpacity: 0.9, strokeWeight: 4 }}
                  />
                )}
                {/* Corridor-matched fixes, dashed: display only. */}
                {snapPath.length > 1 && (
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
                {trail.length > 0 && (
                  <MarkerF
                    position={trail[0]}
                    icon={pinIcon('#2563EB', true)}
                    title="Trail start"
                  />
                )}

                {selectedVehicle && selectedVehicle.latitude != null && (
                  <InfoWindowF
                    position={{ lat: selectedVehicle.latitude, lng: selectedVehicle.longitude }}
                    onCloseClick={() => setSelectedReg(null)}
                  >
                    <div
                      style={{
                        padding: '4px 2px',
                        minWidth: 180,
                        fontFamily: 'system-ui, sans-serif',
                      }}
                    >
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
                        {selectedVehicle.registrationNumber || selectedVehicle.vin}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: getStateMeta(selectedVehicle.state).color,
                          fontWeight: 600,
                          margin: '4px 0',
                        }}
                      >
                        {getStateMeta(selectedVehicle.state).label}
                        {selectedVehicle.isStale ? ' (stale)' : ''}
                      </p>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0' }}>
                        Speed:{' '}
                        {selectedVehicle.speed != null
                          ? `${Math.round(selectedVehicle.speed)} km/h`
                          : '—'}
                        {' · '}Ignition: {selectedVehicle.ignition ? 'On' : 'Off'}
                      </p>
                      {selectedVehicle.primaryFuelLevel != null && (
                        <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0' }}>
                          Fuel: {selectedVehicle.primaryFuelLevel} L
                        </p>
                      )}
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0' }}>
                        {'🕐 '}
                        {formatIST(selectedVehicle.eventDateTime)}
                      </p>
                      {trailLoading && (
                        <p style={{ fontSize: 11, color: '#2563eb', margin: '4px 0' }}>
                          Loading trail…
                        </p>
                      )}
                      {trailError && (
                        <p style={{ fontSize: 11, color: '#b91c1c', margin: '4px 0' }}>
                          {trailError}
                        </p>
                      )}
                      {!trailLoading && !trailError && trail.length > 1 && (
                        <p style={{ fontSize: 11, color: '#2563eb', margin: '4px 0' }}>
                          Trail: {trail.length} points
                          {trailTruncated && ` of ${trailTruncated.totalCount}`}
                          {snapPath.length > 1 && ` · ${snapPath.length} snapped to corridor`}
                        </p>
                      )}
                      {!trailLoading && trailTruncated && (
                        <p style={{ fontSize: 11, color: '#b45309', margin: '4px 0' }}>
                          Oldest points only — trail continues to{' '}
                          {formatIST(trailTruncated.coveredTo)}. Narrow the window for the rest.
                        </p>
                      )}
                    </div>
                  </InfoWindowF>
                )}
              </GoogleMap>
            )}
          </div>
        </div>
      </PageShell>
    </div>
  );
};

export default LiveTrackingPage;
