import { useRef } from 'react';
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api';
import { LocateFixed, MapPin } from 'lucide-react';
import { googleMapsLoaderOptions } from '../../../utils/googleMapsLoader';

const MAP_OPTIONS = {
  disableDefaultUI: true,
  clickableIcons: true,
  gestureHandling: 'greedy',
  draggable: true,
  scrollwheel: true,
  keyboardShortcuts: true,
  zoomControl: true,
  mapTypeControl: true,
  fullscreenControl: false,
  streetViewControl: false,
};

export default function PumpLocationMap({ coords, candidate }) {
  const { isLoaded, loadError } = useLoadScript(googleMapsLoaderOptions);
  const mapRef = useRef(null);
  return (
    <>
      <div className="mhub-pump-map-toolbar">
        <span>Refuel location</span>
        <button
          type="button"
          className="mhub-pump-recenter"
          disabled={!isLoaded || !!loadError}
          onClick={() => {
            mapRef.current?.panTo(coords);
            mapRef.current?.setZoom(15);
          }}
        >
          <LocateFixed size={14} aria-hidden="true" /> Back to refuel pin
        </button>
      </div>
      <div className="mhub-pump-map" aria-label="Interactive map of refuel location">
        {isLoaded && !loadError ? (
          <GoogleMap
            center={coords}
            zoom={15}
            mapContainerStyle={{ width: '100%', height: '100%' }}
            options={MAP_OPTIONS}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            onUnmount={() => {
              mapRef.current = null;
            }}
          >
            <MarkerF position={coords} draggable={false} title="Recorded refuel location" />
            {candidate?.lat != null && candidate?.lng != null && (
              <MarkerF
                position={{ lat: candidate.lat, lng: candidate.lng }}
                label="S"
                title={`Suggested station: ${candidate.name}`}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="mhub-pump-map-fallback">
            <MapPin size={25} aria-hidden="true" />
            <span>{loadError ? 'Map unavailable' : 'Loading location…'}</span>
          </div>
        )}
      </div>
      <div className="mhub-pump-map-meta">
        <span>Drag to explore · Scroll or pinch to zoom</span>
        <small>
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </small>
      </div>
    </>
  );
}
