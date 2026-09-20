import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { GoogleMap, useLoadScript, MarkerF, PolylineF } from '@react-google-maps/api';
import { ShareService } from '../../services/ShareService';
import {
  INDIA_CENTER,
  POLL_INTERVAL_MS,
  NOVA_STATUS,
  LIGHT_MAP_STYLE,
  plateMarkerIcon,
  trailArrowIcons,
  formatAgoText,
} from '../LiveTracking/liveTracking.shared.js';
import './PublicTracking.css';

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '')
  .replace(/['"]/g, '')
  .trim();

const ICONS = {
  truck:
    '<path d="M14 17V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1.5"/><path d="M9.5 17h3"/><path d="M19.5 17H21a1 1 0 0 0 1-1v-3.3a1 1 0 0 0-.2-.6l-3-3.7a1 1 0 0 0-.8-.4H14"/><circle cx="17" cy="17.5" r="2"/><circle cx="6.8" cy="17.5" r="2"/>',
  gauge:
    '<circle cx="12" cy="12" r="9"/><path d="M12 12l4.5-4"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  zap: '<path d="M13 2 3.5 14H12l-1 8 9.5-12H13z"/>',
  nav: '<path d="M3 11 22 2l-9 19-2-8z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  radio:
    '<circle cx="12" cy="12" r="2"/><path d="M7.8 16.2a6 6 0 0 1 0-8.4"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4"/><path d="M4.9 19.1a10 10 0 0 1 0-14.2"/><path d="M19.1 4.9a10 10 0 0 1 0 14.2"/>',
  route:
    '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>',
};

const Icon = ({ name, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }}
  />
);

// Small "start of trail" dot marker (where the recorded path begins).
const startDotIcon = (color) => {
  if (typeof window === 'undefined' || !window.google) return undefined;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
    <circle cx="9" cy="9" r="6" fill="#ffffff" stroke="${color}" stroke-width="3"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(18, 18),
    anchor: new window.google.maps.Point(9, 9),
  };
};

const minutesSince = (iso) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 60000));
};

/**
 * Public, no-login viewer for a single shared vehicle (/track/:token). Styled to
 * match the internal live-tracking console — dark glass panel, plate-pill marker,
 * muted map — but scoped to exactly one vehicle. Renders only what the public
 * share endpoint returns; a missing/revoked/expired token shows a dead-link card.
 */
const PublicTrackingPage = () => {
  const { token } = useParams();
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const [phase, setPhase] = useState('loading'); // loading | ok | dead | error
  const [vehicle, setVehicle] = useState(null);
  const [trail, setTrail] = useState([]);
  const [showTrail, setShowTrail] = useState(false);
  const [trailLoading, setTrailLoading] = useState(false);
  const mapRef = useRef(null);
  const trailFetchedRef = useRef(false);
  const hasDataRef = useRef(false);

  const fetchPosition = useCallback(
    async (signal) => {
      try {
        const data = await ShareService.getPublicShare(token, { signal });
        hasDataRef.current = true;
        setVehicle(data);
        setPhase('ok');
      } catch (err) {
        if (signal?.aborted) return;
        const status = err?.response?.status;
        // A definite 404 means the link is gone — show the dead card.
        if (status === 404) {
          setPhase('dead');
          return;
        }
        // Any other (transient) failure must NOT wipe a working view: only
        // surface the error card if we never managed to load the vehicle.
        if (!hasDataRef.current) setPhase('error');
      }
    },
    [token],
  );

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

  // Trail is opt-in (off by default). Toggling on lazily fetches it once.
  const toggleTrail = useCallback(() => {
    if (showTrail) {
      setShowTrail(false);
      return;
    }
    setShowTrail(true);
    if (trailFetchedRef.current) return;
    trailFetchedRef.current = true;
    setTrailLoading(true);
    ShareService.getPublicShareTrail(token)
      .then((data) => {
        const pts = (data?.points || [])
          .filter((p) => p.latitude != null && p.longitude != null)
          .map((p) => ({ lat: p.latitude, lng: p.longitude }));
        setTrail(pts);
      })
      .catch(() => {
        // Trail is optional; the pin still renders without it.
      })
      .finally(() => setTrailLoading(false));
  }, [showTrail, token]);

  const hasFix = vehicle && vehicle.latitude != null && vehicle.longitude != null;
  const center = useMemo(
    () => (hasFix ? { lat: vehicle.latitude, lng: vehicle.longitude } : INDIA_CENTER),
    [hasFix, vehicle],
  );
  const statusMeta = NOVA_STATUS[vehicle?.status] || NOVA_STATUS.offline;
  const statusColor = statusMeta.c;
  const gpsLabel = hasFix && !vehicle?.isStale ? 'Active' : 'No fix';

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

  useEffect(() => {
    if (mapRef.current && hasFix) mapRef.current.panTo(center);
  }, [center, hasFix]);

  if (phase === 'dead' || phase === 'error') {
    const dead = phase === 'dead';
    return (
      <div className="pt-wrap">
        <div className="pt-card">
          <div className="pt-card-icon">{dead ? '🔗' : '⚠️'}</div>
          <h1>{dead ? 'This tracking link is no longer active' : 'Something went wrong'}</h1>
          <p>
            {dead
              ? 'The link may have expired or been turned off by the sender.'
              : "We couldn't load this vehicle right now. Please try again shortly."}
          </p>
        </div>
      </div>
    );
  }

  const ago = minutesSince(vehicle?.eventDateTime);

  return (
    <div className="pt-page">
      <div className="pt-brandbar">
        <span className="pt-live">
          <Icon name="radio" size={14} />
        </span>
        Live vehicle tracking
      </div>

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
              // One-finger pan on touch (like the Google Maps app); the embed
              // default is 'cooperative', which forces a two-finger drag.
              gestureHandling: 'greedy',
              styles: LIGHT_MAP_STYLE,
            }}
          >
            {showTrail && trail.length > 1 && (
              <>
                <PolylineF
                  path={trail}
                  options={{
                    strokeColor: statusColor,
                    strokeOpacity: 0.85,
                    strokeWeight: 4,
                    icons: trailArrowIcons(statusColor),
                  }}
                />
                <MarkerF position={trail[0]} icon={startDotIcon(statusColor)} />
              </>
            )}
            {hasFix && (
              <MarkerF
                position={center}
                icon={plateMarkerIcon(vehicle.registrationNumber, statusColor)}
              />
            )}
          </GoogleMap>
        )}
        {phase === 'ok' && !hasFix && (
          <div className="pt-nofix">Location unavailable — waiting for a GPS fix.</div>
        )}
        {showTrail && !trailLoading && trail.length < 2 && (
          <div className="pt-nofix">No recorded movement in this window.</div>
        )}
      </div>

      {vehicle && (
        <div className="pt-panel">
          <div className="pt-panel-head">
            <div className="pt-tile" style={{ '--c': statusColor }}>
              <Icon name="truck" size={22} />
            </div>
            <div className="pt-idblock">
              <div className="pt-plate">{vehicle.registrationNumber}</div>
              <div className="pt-sub">{vehicle.label || 'Shared live location'}</div>
            </div>
            <span className="pt-chip" style={{ '--c': statusColor, '--tint': statusMeta.tint }}>
              <i />
              {statusMeta.label}
            </span>
          </div>

          <div className="pt-metrics">
            <div className="pt-metric">
              <div className="k">Speed</div>
              <div className="v">
                {vehicle.speed != null ? `${Math.round(vehicle.speed)} km/h` : '—'}
              </div>
            </div>
            <div className="pt-metric">
              <div className="k">Ignition</div>
              <div className={`v ${vehicle.ignition === 'ON' ? 'ok' : 'off'}`}>
                {vehicle.ignition || '—'}
              </div>
            </div>
            <div className="pt-metric">
              <div className="k">GPS</div>
              <div className={`v ${gpsLabel === 'Active' ? 'ok' : 'off'}`}>{gpsLabel}</div>
            </div>
          </div>

          <div className="pt-lines">
            <div className="pt-line">
              <Icon name="pin" />
              <span>
                {hasFix
                  ? `${vehicle.latitude.toFixed(4)}, ${vehicle.longitude.toFixed(4)}`
                  : 'GPS position unavailable'}
              </span>
            </div>
            <div className="pt-line">
              <Icon name="clock" />
              <span>{ago != null ? `Updated ${formatAgoText(ago)}` : 'Awaiting update'}</span>
            </div>
          </div>

          {vehicle.trailHours > 0 && hasFix && (
            <button
              className={`pt-panel-trail ${showTrail ? 'on' : ''}`}
              onClick={toggleTrail}
              disabled={trailLoading}
            >
              <Icon name="route" size={16} />
              {trailLoading ? 'Loading trail…' : showTrail ? 'Hide trail' : 'Show trail'}
            </button>
          )}

          <div className="pt-secure">Shared securely · you can only see this one vehicle</div>
        </div>
      )}
    </div>
  );
};

export default PublicTrackingPage;
