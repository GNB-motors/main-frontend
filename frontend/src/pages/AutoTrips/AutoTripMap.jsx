import { useCallback, useMemo } from 'react';
import { GoogleMap, useLoadScript, MarkerF } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const CONTAINER = { width: '100%', height: '100%', borderRadius: 'inherit' };
const INDIA = { lat: 22.9734, lng: 78.6569 };

const hasLatLng = (p) => p && p.lat != null && p.lng != null;

/**
 * Pickup → drop mini-map for a trip. Two markers (P, D) and a fit to both.
 * Never reverse-geocodes — coordinates are shown as-is (see CLAUDE.md geocoding
 * cost landmine).
 */
export default function AutoTripMap({ pickup, drop }) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const p = useMemo(
    () => (hasLatLng(pickup) ? { lat: pickup.lat, lng: pickup.lng } : null),
    [pickup],
  );
  const d = useMemo(() => (hasLatLng(drop) ? { lat: drop.lat, lng: drop.lng } : null), [drop]);
  const center = useMemo(() => p || d || INDIA, [p, d]);

  const onLoad = useCallback(
    (map) => {
      if (p && d && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(p);
        bounds.extend(d);
        map.fitBounds(bounds, 48);
      }
    },
    [p, d],
  );

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div style={emptyStyle}>
        <strong>Map unavailable</strong>
        <span>No Google Maps key is configured.</span>
      </div>
    );
  }

  if (!isLoaded) return <div style={{ ...CONTAINER, background: '#eef0f3' }} aria-hidden="true" />;

  if (!p && !d) {
    return (
      <div style={emptyStyle}>
        <strong>No coordinates</strong>
        <span>This trip has no mapped pickup or drop yet.</span>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={CONTAINER}
      center={center}
      zoom={p && d ? 9 : 12}
      onLoad={onLoad}
      options={{ disableDefaultUI: true, zoomControl: true, gestureHandling: 'cooperative' }}
    >
      {p ? <MarkerF position={p} label="P" title={pickup?.name || 'Pickup'} /> : null}
      {d ? <MarkerF position={d} label="D" title={drop?.name || 'Drop'} /> : null}
    </GoogleMap>
  );
}

const emptyStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  height: '100%',
  background: '#f6f7f9',
  color: '#666',
  fontSize: 13,
};
