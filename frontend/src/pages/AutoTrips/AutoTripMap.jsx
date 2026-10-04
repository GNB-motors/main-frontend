import { GoogleMap, useLoadScript, MarkerF, PolylineF } from '@react-google-maps/api';
import { routeMapPoints } from './autoTripModel';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const CONTAINER = { width: '100%', height: '100%', borderRadius: 'inherit' };
const INDIA = { lat: 22.9734, lng: 78.6569 };
const ROUTE_LINE = { strokeColor: '#2563eb', strokeOpacity: 0.7, strokeWeight: 3 };

/**
 * A trip's route: pickup (P), the stops the truck made after leaving the plant (small
 * dots, joined in time order), the drop (D) and any further drops (D2…). The line joins
 * stops; it is not the road driven. Never reverse-geocodes — coordinates are shown as-is
 * (see CLAUDE.md geocoding cost landmine).
 */
export default function AutoTripMap({ pickup, drop, extraDrops, routeStops }) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const pts = routeMapPoints({ pickup, drop, extraDrops, routeStops });

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div style={emptyStyle}>
        <strong>Map unavailable</strong>
        <span>No Google Maps key is configured.</span>
      </div>
    );
  }

  if (!isLoaded) return <div style={{ ...CONTAINER, background: '#eef0f3' }} aria-hidden="true" />;

  if (!pts.all.length) {
    return (
      <div style={emptyStyle}>
        <strong>No coordinates</strong>
        <span>This trip has no mapped pickup or drop yet.</span>
      </div>
    );
  }

  const fit = (map) => {
    if (pts.all.length > 1 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      pts.all.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, 48);
    }
  };
  const dot = {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 4,
    fillColor: '#2563eb',
    fillOpacity: 0.9,
    strokeColor: '#fff',
    strokeWeight: 1,
  };

  return (
    <GoogleMap
      mapContainerStyle={CONTAINER}
      center={pts.pickup || pts.drop || INDIA}
      zoom={pts.all.length > 1 ? 9 : 12}
      onLoad={fit}
      options={{ disableDefaultUI: true, zoomControl: true, gestureHandling: 'cooperative' }}
    >
      {pts.path.length > 1 ? <PolylineF path={pts.path} options={ROUTE_LINE} /> : null}
      {pts.stops.map((s) => (
        <MarkerF key={s.id} position={s.at} icon={dot} title="Stop" />
      ))}
      {pts.pickup ? (
        <MarkerF position={pts.pickup} label="P" title={pickup?.name || 'Pickup'} />
      ) : null}
      {pts.drop ? <MarkerF position={pts.drop} label="D" title={drop?.name || 'Drop'} /> : null}
      {pts.extras.map((x) => (
        <MarkerF key={x.id} position={x.at} label={x.label} title="Further drop" />
      ))}
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
