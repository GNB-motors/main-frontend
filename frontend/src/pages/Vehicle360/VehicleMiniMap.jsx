import { useMemo } from 'react';
import { GoogleMap, useLoadScript, MarkerF } from '@react-google-maps/api';
import { INDIA_CENTER, getStateMeta, pinIcon } from '../LiveTracking/liveTracking.shared.js';
import { timeAgo } from '../../utils/formatters';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%', borderRadius: 'inherit' };

/**
 * Small single-vehicle map for the hero card — same marker styling as the
 * full Live Tracking page and the org-wide dashboard mini-map
 * (`liveTracking.shared.js`), so a pin means the same thing everywhere.
 *
 * `livePosition` arrives once with the rest of the vehicle profile fetch; this
 * widget does not poll on its own, and it never reverse-geocodes the pin (see
 * CLAUDE.md's geocoding cost landmine) — the coordinates are shown as-is.
 */
export default function VehicleMiniMap({ livePosition }) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const hasFix = livePosition?.latitude != null && livePosition?.longitude != null;
  const center = useMemo(
    () => (hasFix ? { lat: livePosition.latitude, lng: livePosition.longitude } : INDIA_CENTER),
    [hasFix, livePosition],
  );
  const meta = getStateMeta(livePosition?.state);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="v360-minimap v360-minimap--empty">
        <span className="v360-empty-title">Map unavailable</span>
        <span className="v360-empty-hint">No Google Maps key is configured.</span>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="v360-minimap v360-minimap--loading" aria-hidden="true" />;
  }

  if (!hasFix) {
    return (
      <div className="v360-minimap v360-minimap--empty">
        <span className="v360-empty-title">No live position</span>
        <span className="v360-empty-hint">Appears once live tracking polls this vehicle.</span>
      </div>
    );
  }

  return (
    <div className="v360-minimap">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={13}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
        }}
      >
        <MarkerF
          position={center}
          icon={pinIcon(meta.color, livePosition.isStale || livePosition.state === 'OFFLINE')}
          title={livePosition.speed != null ? `${Math.round(livePosition.speed)} km/h` : meta.label}
        />
      </GoogleMap>
      <span className="v360-minimap-badge">
        <span
          className="v360-minimap-badge-dot"
          style={{ background: meta.color }}
          aria-hidden="true"
        />
        {meta.label}
        {livePosition.pulledAt ? ` · ${timeAgo(livePosition.pulledAt)}` : ''}
      </span>
    </div>
  );
}
