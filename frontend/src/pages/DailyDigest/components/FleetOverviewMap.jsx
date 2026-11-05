import { googleMapsLoaderOptions } from '../../../utils/googleMapsLoader.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { MapPinOff } from 'lucide-react';
import AnimatedVehicleMarkers from '../../LiveTracking/AnimatedVehicleMarkers.jsx';
import { LIGHT_MAP_STYLE, DARK_MAP_STYLE } from '../../LiveTracking/mapStyles';
import useDocumentTheme from '../../LiveTracking/useDocumentTheme';
import DigestSkeleton from './DigestSkeleton';

const CENTER = { lat: 22.5937, lng: 78.9629 };
const SIZE = { width: '100%', height: '100%' };
const KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').replace(/['"]/g, '').trim();

function GoogleFleetMap({ vehicles, selectedId, onSelect }) {
  const { isLoaded, loadError } = useLoadScript(googleMapsLoaderOptions);
  const theme = useDocumentTheme();
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(5);
  const fitted = useRef(false);
  const selected = vehicles.find((v) => v.id === selectedId);

  const fit = useCallback(() => {
    if (!map || !window.google || !vehicles.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    vehicles.forEach((v) => bounds.extend({ lat: v.lat, lng: v.lng }));
    map.fitBounds(bounds, 48);
    window.google.maps.event.addListenerOnce(map, 'idle', () => {
      if ((map.getZoom() || 5) > 13) map.setZoom(13);
    });
    fitted.current = true;
  }, [map, vehicles]);

  useEffect(() => {
    if (!fitted.current) fit();
  }, [fit]);

  useEffect(() => {
    if (map && selected) {
      map.panTo({ lat: selected.lat, lng: selected.lng });
      if ((map.getZoom() || 5) < 12) map.setZoom(12);
    }
  }, [map, selected]);

  if (loadError)
    return (
      <div className="fo-map-state" role="status">
        <MapPinOff size={26} />
        <strong>Map could not load</strong>
        <span>Vehicle updates are still available in the list.</span>
      </div>
    );
  if (!isLoaded) return <DigestSkeleton variant="map" label="Loading fleet map" />;

  return (
    <>
      <GoogleMap
        mapContainerStyle={SIZE}
        center={CENTER}
        zoom={5}
        onLoad={setMap}
        onZoomChanged={() => map && setZoom(map.getZoom() || 5)}
        options={{
          styles: theme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'cooperative',
        }}
      >
        <AnimatedVehicleMarkers
          vehicles={vehicles}
          selectedId={selectedId}
          onSelect={onSelect}
          mapZoom={zoom}
        />
      </GoogleMap>
      <button type="button" className="fo-map-fit" onClick={fit}>
        Fit fleet
      </button>
    </>
  );
}

export default function FleetOverviewMap(props) {
  if (!KEY)
    return (
      <div className="fo-map-state" role="status">
        <MapPinOff size={26} />
        <strong>Map unavailable</strong>
        <span>A map key is not configured. Use the vehicle list to continue.</span>
      </div>
    );
  return <GoogleFleetMap {...props} />;
}
