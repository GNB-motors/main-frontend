import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GoogleMap,
  useLoadScript,
  DirectionsRenderer,
  Marker,
  PolylineF,
} from '@react-google-maps/api';
import { MapPin, CircleDot, Navigation, Activity, ShieldCheck, AlertCircle } from 'lucide-react';
import { START_MARKER_SVG, END_MARKER_SVG } from './tripReportDetailMapIcons';
import { toFrames, toLatLngSegments, replayStats } from '../../RouteReplay/routeReplay';
import { trailWindowForTrip } from './tripReportTrailWindow';
import { LiveTrackingService } from '../../LiveTracking/LiveTrackingService.jsx';

const GOOGLE_MAPS_LIBRARIES = ['places', 'directions'];

/**
 * Map for the trip report detail view. Prefers the breadcrumb trail the truck
 * actually drove (LiveVehiclePositionHistory via /trail, same source the Route
 * Replay page uses — the pure maths lives in routeReplay.js and is reused, not
 * copied). Falls back to planned driving directions between the place names
 * only when the trip has no usable dates or the trail has too few points.
 *
 * Reuses toLatLngSegments to cleanly split polylines at signal-loss and
 * inter-trip breaks, avoiding straight-line jumps across the map.
 */
const TripReportRouteMap = ({ startLoc, endLoc, vehicleReg, trip }) => {
  const [directions, setDirections] = useState(null);
  const [mapPoints, setMapPoints] = useState({ start: null, end: null });
  const [trailSegments, setTrailSegments] = useState([]);
  const [trailStats, setTrailStats] = useState(null);
  const [trailLoading, setTrailLoading] = useState(false);
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
            setMapPoints((prev) => ({
              start: prev.start || { lat: leg.start_location.lat(), lng: leg.start_location.lng() },
              end: prev.end || { lat: leg.end_location.lat(), lng: leg.end_location.lng() },
            }));
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
    setTrailLoading(true);

    LiveTrackingService.getTrail(vehicleReg, {
      from: window_.fromIso,
      to: window_.toIso,
      limit: 5000,
    })
      .then((trail) => {
        if (cancelled) return;
        const frames = toFrames(trail?.points);
        if (frames.length >= 2) {
          const segments = toLatLngSegments(frames);
          const stats = replayStats(frames);
          setTrailSegments(segments);
          setTrailStats(stats);

          const firstPt = segments[0]?.[0];
          const lastSeg = segments[segments.length - 1];
          const lastPt = lastSeg?.[lastSeg.length - 1];
          if (firstPt && lastPt) {
            setMapPoints({ start: firstPt, end: lastPt });
          }
        } else {
          setTrailSegments([]);
          setTrailStats(null);
        }
      })
      .catch(() => {
        /* directions fallback already rendered */
        setTrailSegments([]);
        setTrailStats(null);
      })
      .finally(() => {
        if (!cancelled) setTrailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, vehicleReg, trip]);

  // Fit the map to the actual trail when it arrives.
  useEffect(() => {
    if (!mapRef.current || !window.google || !trailSegments.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    let pointCount = 0;
    trailSegments.forEach((seg) => {
      seg.forEach((p) => {
        bounds.extend(p);
        pointCount += 1;
      });
    });
    if (pointCount > 0) {
      mapRef.current.fitBounds(bounds, 48);
    }
  }, [trailSegments]);

  const hasTrail = trailSegments.length > 0;
  const showDirections = !hasTrail && directions;

  return (
    <div className="trip-detail-map-section">
      {/* Route Provenance & Telemetry Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          {hasTrail ? (
            <span className="inline-flex items-center gap-1 font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
              <ShieldCheck size={13} />
              Actual GPS Trail
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              <AlertCircle size={13} />
              Planned Route Fallback
            </span>
          )}
          {trailLoading && <span className="text-slate-400">Loading telemetry…</span>}
        </div>

        {trailStats && (
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span title="Actual ground distance derived from GPS fixes">
              Ground:{' '}
              <strong className="text-slate-800">{trailStats.distanceKm.toFixed(1)} km</strong>
            </span>
            {trip?.distanceKm && (
              <span className="text-slate-400" title="Planned distance from ERP route">
                Planned: {Number(trip.distanceKm).toFixed(1)} km
              </span>
            )}
            <span className="text-slate-500">
              {trailStats.pointCount} fixes ({trailSegments.length} segment
              {trailSegments.length > 1 ? 's' : ''})
            </span>
          </div>
        )}
      </div>

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
                  polylineOptions: {
                    strokeColor: '#64748b',
                    strokeWeight: 4,
                    strokeOpacity: 0.7,
                    strokeDashstyle: 'dash',
                  },
                  suppressMarkers: true,
                }}
              />
            )}
            {hasTrail &&
              trailSegments.map((segment, idx) => (
                <PolylineF
                  key={`trail-seg-${idx}`}
                  path={segment}
                  options={{
                    strokeColor: '#0284c7',
                    strokeWeight: 4,
                    strokeOpacity: 0.85,
                  }}
                />
              ))}
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
