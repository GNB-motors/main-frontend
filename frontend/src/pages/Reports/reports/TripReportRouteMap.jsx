import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GoogleMap,
  useLoadScript,
  DirectionsRenderer,
  Marker,
  PolylineF,
} from '@react-google-maps/api';
import { MapPin, CircleDot } from 'lucide-react';
import { START_MARKER_SVG, END_MARKER_SVG } from './tripReportDetailMapIcons';
import { toFrames, toLatLngPath } from '../../RouteReplay/routeReplay';
import { trailWindowForTrip } from './tripReportTrailWindow';
import { LiveTrackingService } from '../../LiveTracking/LiveTrackingService.jsx';

const GOOGLE_MAPS_LIBRARIES = ['places', 'directions'];

/**
 * Map for the trip report detail view. Prefers the breadcrumb trail the truck
 * actually drove (LiveVehiclePositionHistory via /trail, same source the Route
 * Replay page uses — the pure maths lives in routeReplay.js and is reused, not
 * copied). Falls back to planned driving directions between the place names
 * only when the trip has no usable dates or the trail has too few points.
 */
const TripReportRouteMap = ({ startLoc, endLoc, vehicleReg, trip }) => {
  const [directions, setDirections] = useState(null);
  const [mapPoints, setMapPoints] = useState({ start: null, end: null });
  const [trailPath, setTrailPath] = useState(null);
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

  // Load the actual ground covered for this trip's window. Any failure or a
  // too-short trail silently leaves the directions fallback in place.
  useEffect(() => {
    if (!isLoaded || !vehicleReg || vehicleReg === '-' || !trip) return;
    const window_ = trailWindowForTrip(trip);
    if (!window_) return;
    let cancelled = false;
    LiveTrackingService.getTrail(vehicleReg, {
      from: window_.fromIso,
      to: window_.toIso,
      limit: 5000,
    })
      .then((trail) => {
        if (cancelled) return;
        const path = toLatLngPath(toFrames(trail?.points));
        if (path.length >= 2) {
          setTrailPath(path);
          setMapPoints({ start: path[0], end: path[path.length - 1] });
        }
      })
      .catch(() => {
        /* directions fallback already rendered */
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, vehicleReg, trip]);

  // Fit the map to the actual trail when it arrives.
  useEffect(() => {
    if (!mapRef.current || !window.google || !trailPath || trailPath.length < 2) return;
    const bounds = new window.google.maps.LatLngBounds();
    trailPath.forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 48);
  }, [trailPath]);

  const showDirections = !trailPath && directions;

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
            {showDirections && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  polylineOptions: { strokeColor: '#1a73e8', strokeWeight: 4, strokeOpacity: 0.8 },
                  suppressMarkers: true,
                }}
              />
            )}
            {trailPath && (
              <PolylineF
                path={trailPath}
                options={{ strokeColor: '#1a73e8', strokeWeight: 4, strokeOpacity: 0.85 }}
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
