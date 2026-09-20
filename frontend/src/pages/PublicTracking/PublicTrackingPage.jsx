import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { GoogleMap, useLoadScript, MarkerF, PolylineF } from '@react-google-maps/api';
import { ShareService } from '../../services/ShareService';
import {
  INDIA_CENTER,
  POLL_INTERVAL_MS,
  NOVA_STATUS,
  pinIcon,
  formatAgoText,
} from '../LiveTracking/liveTracking.shared.js';
import './PublicTracking.css';

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '')
  .replace(/['"]/g, '')
  .trim();

const minutesSince = (iso) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 60000));
};

const StatusChip = ({ status }) => {
  const meta = NOVA_STATUS[status] || NOVA_STATUS.offline;
  return (
    <span className="pt-chip" style={{ '--c': meta.c, '--tint': meta.tint }}>
      <i />
      {meta.label}
    </span>
  );
};

/**
 * Public, no-login viewer for a single shared vehicle. Reached via
 * /track/:token. Renders only what the public share endpoint returns — one
 * vehicle's live pin, status, last update, and recent trail. A missing /
 * revoked / expired token shows a dead-link card.
 */
const PublicTrackingPage = () => {
  const { token } = useParams();
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const [phase, setPhase] = useState('loading'); // loading | ok | dead | error
  const [vehicle, setVehicle] = useState(null);
  const [trail, setTrail] = useState([]);
  const mapRef = useRef(null);
  const trailFetchedRef = useRef(false);

  const fetchPosition = useCallback(
    async (signal) => {
      try {
        const data = await ShareService.getPublicShare(token, { signal });
        setVehicle(data);
        setPhase('ok');
      } catch (err) {
        if (signal?.aborted) return;
        const status = err?.response?.status;
        setPhase(status === 404 ? 'dead' : 'error');
      }
    },
    [token],
  );

  // Poll the current position.
  useEffect(() => {
    const controller = new AbortController();
    fetchPosition(controller.signal);
    const id = setInterval(() => {
      const c = new AbortController();
      fetchPosition(c.signal);
    }, POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [fetchPosition]);

  // Load the recent trail once we know the link is valid.
  useEffect(() => {
    if (phase !== 'ok' || trailFetchedRef.current) return;
    trailFetchedRef.current = true;
    const controller = new AbortController();
    ShareService.getPublicShareTrail(token, { signal: controller.signal })
      .then((data) => {
        const pts = (data?.points || [])
          .filter((p) => p.latitude != null && p.longitude != null)
          .map((p) => ({ lat: p.latitude, lng: p.longitude }));
        setTrail(pts);
      })
      .catch(() => {
        // Trail is optional; the pin still renders without it.
      });
    return () => controller.abort();
  }, [phase, token]);

  const hasFix = vehicle && vehicle.latitude != null && vehicle.longitude != null;
  const center = useMemo(
    () => (hasFix ? { lat: vehicle.latitude, lng: vehicle.longitude } : INDIA_CENTER),
    [hasFix, vehicle],
  );
  const statusColor = (NOVA_STATUS[vehicle?.status] || NOVA_STATUS.offline).c;

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      if (hasFix) {
        map.panTo(center);
        map.setZoom(13);
      }
    },
    [center, hasFix],
  );

  // Keep the map centred on the moving vehicle.
  useEffect(() => {
    if (mapRef.current && hasFix) mapRef.current.panTo(center);
  }, [center, hasFix]);

  if (phase === 'dead') {
    return (
      <div className="pt-wrap">
        <div className="pt-card">
          <div className="pt-card-icon">🔗</div>
          <h1>This tracking link is no longer active</h1>
          <p>The link may have expired or been turned off by the sender.</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="pt-wrap">
        <div className="pt-card">
          <div className="pt-card-icon">⚠️</div>
          <h1>Something went wrong</h1>
          <p>We couldn&apos;t load this vehicle right now. Please try again shortly.</p>
        </div>
      </div>
    );
  }

  const ago = minutesSince(vehicle?.eventDateTime);

  return (
    <div className="pt-page">
      <header className="pt-header">
        <div className="pt-brand">
          <span className="pt-live-dot" />
          Live vehicle tracking
        </div>
        {vehicle && (
          <div className="pt-headline">
            <div className="pt-plate">{vehicle.registrationNumber}</div>
            <StatusChip status={vehicle.status} />
          </div>
        )}
        {vehicle?.label && <div className="pt-label">{vehicle.label}</div>}
        <div className="pt-meta">
          {vehicle?.speed != null && <span>{Math.round(vehicle.speed)} km/h</span>}
          <span>Ignition {vehicle?.ignition || '—'}</span>
          <span>{ago != null ? `Updated ${formatAgoText(ago)}` : 'Awaiting update'}</span>
        </div>
      </header>

      <div className="pt-map">
        {!GOOGLE_MAPS_API_KEY || !isLoaded ? (
          <div className="pt-map-loading">
            <div className="pt-spinner" />
            <span>Loading map…</span>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={center}
            zoom={hasFix ? 13 : 5}
            onLoad={onMapLoad}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              clickableIcons: false,
            }}
          >
            {trail.length > 1 && (
              <PolylineF
                path={trail}
                options={{ strokeColor: statusColor, strokeOpacity: 0.85, strokeWeight: 4 }}
              />
            )}
            {hasFix && <MarkerF position={center} icon={pinIcon(statusColor)} />}
          </GoogleMap>
        )}
        {phase === 'ok' && !hasFix && (
          <div className="pt-nofix">Location unavailable — waiting for a GPS fix.</div>
        )}
      </div>

      <footer className="pt-footer">Shared securely · you can only see this one vehicle</footer>
    </div>
  );
};

export default PublicTrackingPage;
