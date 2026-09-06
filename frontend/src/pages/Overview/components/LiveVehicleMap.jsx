import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Navigation, WifiOff, Maximize2 } from 'lucide-react';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Panel } from './overview.primitives.jsx';
import { LiveTrackingService } from '../../LiveTracking/LiveTrackingService.jsx';
import {
  INDIA_CENTER,
  POLL_INTERVAL_MS,
  STATE_META,
  getStateMeta,
  formatIST,
  pinIcon,
  withCoordinates,
  fitMapToPositions,
} from '../../LiveTracking/liveTracking.shared.js';

const MAP_CONTAINER_STYLE = { width: '100%', height: '420px', borderRadius: '0.75rem' };
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const LiveVehicleMap = () => {
  const [positions, setPositions] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReg, setSelectedReg] = useState(null);
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const mapRef = useRef(null);
  const fetchInFlightRef = useRef(false);

  const fetchPositions = useCallback(async () => {
    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;
    try {
      setPositions(await LiveTrackingService.getPositions());
      setError(null);
    } catch (err) {
      setError(err.detail || 'Could not load live positions.');
    } finally {
      fetchInFlightRef.current = false;
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
    const intervalId = setInterval(fetchPositions, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchPositions]);

  const located = useMemo(() => withCoordinates(positions), [positions]);

  const activeCount = positions.filter((p) => p.state === 'ACTIVE').length;
  const parkedCount = positions.filter((p) => p.state === 'PARKED').length;
  const offlineCount = positions.filter((p) => p.state === 'OFFLINE').length;

  const selectedVehicle = positions.find((p) => p.registrationNumber === selectedReg) || null;

  const fitToVehicles = useCallback(() => {
    fitMapToPositions(mapRef.current, located);
  }, [located]);

  useEffect(() => {
    fitToVehicles();
  }, [fitToVehicles, isLoaded]);

  const legend = (
    <div className="flex flex-wrap items-center gap-3 text-xs text-dim">
      <span className="flex items-center gap-1">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: STATE_META.ACTIVE.color }}
        />{' '}
        Active ({activeCount})
      </span>
      <span className="flex items-center gap-1">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: STATE_META.PARKED.color }}
        />{' '}
        Parked ({parkedCount})
      </span>
      <span className="flex items-center gap-1">
        <WifiOff size={12} /> Offline ({offlineCount})
      </span>
      <Link to="/live-tracking" className="ov-btn px-2.5 py-1" title="Open full live tracking">
        <Maximize2 size={12} /> Expand
      </Link>
    </div>
  );

  return (
    <Panel eyebrow="Live vehicle locations" question="Where is my fleet right now?" action={legend}>
      {!isLoaded || (isFetching && positions.length === 0) ? (
        <Skeleton className="h-[420px] w-full rounded-xl" />
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-dim">
          <AlertTriangle size={40} className="opacity-30" />
          <p className="text-sm">{error}</p>
        </div>
      ) : located.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-dim">
          <Navigation size={40} className="opacity-30" />
          <p className="text-sm">No vehicles with coordinates right now</p>
        </div>
      ) : (
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={INDIA_CENTER}
          zoom={5}
          onLoad={(map) => {
            mapRef.current = map;
            fitToVehicles();
          }}
          onUnmount={() => {
            mapRef.current = null;
          }}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
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
          {selectedVehicle && selectedVehicle.latitude != null && (
            <InfoWindowF
              position={{ lat: selectedVehicle.latitude, lng: selectedVehicle.longitude }}
              onCloseClick={() => setSelectedReg(null)}
            >
              <div
                style={{ padding: '4px 2px', minWidth: 180, fontFamily: 'system-ui, sans-serif' }}
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
                <Link
                  to="/live-tracking"
                  style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}
                >
                  Open in Live Tracking →
                </Link>
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
      )}
    </Panel>
  );
};

export default LiveVehicleMap;
