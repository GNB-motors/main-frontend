import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useLoadScript, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { MapPin, CircleDot } from 'lucide-react';
import { START_MARKER_SVG, END_MARKER_SVG } from './tripReportDetailMapIcons';

const GOOGLE_MAPS_LIBRARIES = ['places', 'directions'];

/** Driving-directions map between two place names, plus a from/to info bar below it. */
const TripReportRouteMap = ({ startLoc, endLoc }) => {
  const [directions, setDirections] = useState(null);
  const [mapPoints, setMapPoints] = useState({ start: null, end: null });
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const calculateRoute = useCallback(() => {
    if (!isLoaded || !window.google) return;
    if (startLoc === '-' || endLoc === '-') return;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: startLoc,
        destination: endLoc,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            setMapPoints({
              start: { lat: leg.start_location.lat(), lng: leg.start_location.lng() },
              end: { lat: leg.end_location.lat(), lng: leg.end_location.lng() },
            });
          }
        }
      },
    );
  }, [isLoaded, startLoc, endLoc]);

  useEffect(() => {
    if (isLoaded) calculateRoute();
  }, [isLoaded, calculateRoute]);

  return (
    <div className="trip-detail-map-section">
      <div className="map-container-wrapper">
        {loadError && (
          <div className="map-error">
            <MapPin size={32} />
            <p>Failed to load Google Maps</p>
          </div>
        )}
        {!isLoaded && !loadError && (
          <div className="map-loading">
            <div className="map-loading-spinner" />
            <p>Loading map...</p>
          </div>
        )}
        {isLoaded && !loadError && (
          <GoogleMap
            mapContainerClassName="trip-map"
            center={{ lat: 22.5726, lng: 88.3639 }}
            zoom={6}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  polylineOptions: { strokeColor: '#1a73e8', strokeWeight: 4, strokeOpacity: 0.8 },
                  suppressMarkers: true,
                }}
              />
            )}
            {mapPoints.start && (
              <Marker
                position={mapPoints.start}
                title={`Start: ${startLoc}`}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(START_MARKER_SVG),
                  scaledSize: new window.google.maps.Size(44, 44),
                  anchor: new window.google.maps.Point(22, 22),
                }}
              />
            )}
            {mapPoints.end && (
              <Marker
                position={mapPoints.end}
                title={`End: ${endLoc}`}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(END_MARKER_SVG),
                  scaledSize: new window.google.maps.Size(36, 48),
                  anchor: new window.google.maps.Point(18, 48),
                }}
              />
            )}
          </GoogleMap>
        )}
      </div>

      <div className="route-info-bar">
        <div className="route-point">
          <CircleDot size={16} color="#16a34a" />
          <div>
            <span className="route-label">From</span>
            <span className="route-value">{startLoc}</span>
          </div>
        </div>
        <div className="route-line" />
        <div className="route-point">
          <MapPin size={16} color="#dc2626" />
          <div>
            <span className="route-label">To</span>
            <span className="route-value">{endLoc}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripReportRouteMap;
