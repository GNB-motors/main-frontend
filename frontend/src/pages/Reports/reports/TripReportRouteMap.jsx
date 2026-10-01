import { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker, PolylineF } from '@react-google-maps/api';
import { MapPin, CircleDot, ShieldCheck, AlertCircle } from 'lucide-react';
import { START_MARKER_SVG, END_MARKER_SVG } from './tripReportDetailMapIcons';
import { toFrames, toLatLngSegments, replayStats } from '../../RouteReplay/routeReplay';
import { trailWindowForTrip } from './tripReportTrailWindow';
import { LiveTrackingService } from '../../LiveTracking/LiveTrackingService.jsx';
import RoadService from '../../../services/RoadService';
import RoadTrailLayer from '../../../components/map/RoadTrailLayer';
import RoadTrailLegend from '../../../components/map/RoadTrailLegend';
import { toLayers, summaryOf } from '../../../lib/roadTrail';

const GOOGLE_MAPS_LIBRARIES = ['places', 'directions'];

/**
 * Map for the trip report detail view (ROAD_INTELLIGENCE plan Task P4.11).
 * Draws the road the truck actually drove (GET /api/road/trail — solid matched road, dashed inferred or
 * provisional, dotted raw fixes) and reports ROAD distance. With the road engine off it draws the raw
 * breadcrumbs split at signal gaps and labels the distance a straight-line estimate.
 * There is no planned-route fallback any more: it called Google Directions, which the owner ruled out
 * (2026-10-01). A trip with no usable GPS window says so instead of drawing a route nobody drove.
 */
const TripReportRouteMap = ({ startLoc, endLoc, vehicleReg, trip }) => {
  const [mapPoints, setMapPoints] = useState({ start: null, end: null });
  const [trailSegments, setTrailSegments] = useState([]);
  const [trailStats, setTrailStats] = useState(null);
  const [roadTrail, setRoadTrail] = useState(null);
  const [trailLoading, setTrailLoading] = useState(false);
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Load the ground covered in this trip's window: raw breadcrumbs, and the road trail when the engine is on.
  useEffect(() => {
    if (!isLoaded || !vehicleReg || vehicleReg === '-' || !trip) return undefined;
    const window_ = trailWindowForTrip(trip);
    if (!window_) return undefined;
    let cancelled = false;
    setTrailLoading(true);

    Promise.all([
      LiveTrackingService.getTrail(vehicleReg, {
        from: window_.fromIso,
        to: window_.toIso,
        limit: 5000,
      }).catch(() => null),
      RoadService.getRoadTrailIfEnabled(vehicleReg, { from: window_.fromIso, to: window_.toIso }),
    ])
      .then(([trail, road]) => {
        if (cancelled) return;
        const frames = toFrames(trail?.points);
        if (frames.length >= 2) {
          const segments = toLatLngSegments(frames);
          setTrailSegments(segments);
          setTrailStats(replayStats(frames));
          const firstPt = segments[0]?.[0];
          const lastSeg = segments[segments.length - 1];
          const lastPt = lastSeg?.[lastSeg.length - 1];
          if (firstPt && lastPt) setMapPoints({ start: firstPt, end: lastPt });
        } else {
          setTrailSegments([]);
          setTrailStats(null);
        }
        setRoadTrail(road && road.mode === 'MATCHED' ? road : null);
      })
      .finally(() => {
        if (!cancelled) setTrailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, vehicleReg, trip]);

  const roadLayers = useMemo(() => toLayers(roadTrail), [roadTrail]);
  const summary = useMemo(() => summaryOf(roadTrail), [roadTrail]);

  // Fit the map to whatever is drawn.
  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    const paths = roadLayers.length ? roadLayers.map((l) => l.path) : trailSegments;
    if (!paths.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    let n = 0;
    paths.forEach((seg) =>
      seg.forEach((p) => {
        bounds.extend(p);
        n += 1;
      }),
    );
    if (n > 0) mapRef.current.fitBounds(bounds, 48);
  }, [trailSegments, roadLayers]);

  const hasTrail = trailSegments.length > 0 || roadLayers.length > 0;
  const groundKm = summary ? summary.km : trailStats ? trailStats.distanceKm : null;
  const groundLabel = summary ? summary.label : 'straight-line estimate';

  return (
    <div className="trip-detail-map-section">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          {hasTrail ? (
            <span className="inline-flex items-center gap-1 font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
              <ShieldCheck size={13} />
              {roadLayers.length ? 'Road driven' : 'Actual GPS Trail'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              <AlertCircle size={13} />
              No GPS trail for this trip window
            </span>
          )}
          {trailLoading && <span className="text-slate-400">Loading telemetry…</span>}
        </div>

        {groundKm != null && (
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span title="Distance the truck covered in this trip's window">
              Ground: <strong className="text-slate-800">{groundKm.toFixed(1)} km</strong>{' '}
              {groundLabel}
            </span>
            {trip?.distanceKm && (
              <span className="text-slate-400" title="Planned distance from ERP route">
                Planned: {Number(trip.distanceKm).toFixed(1)} km
              </span>
            )}
            {trailStats && <span className="text-slate-500">{trailStats.pointCount} fixes</span>}
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
            {roadLayers.length > 0 ? (
              <RoadTrailLayer layers={roadLayers} color="#0284c7" />
            ) : (
              trailSegments.map((segment, idx) => (
                <PolylineF
                  key={`trail-seg-${idx}`}
                  path={segment}
                  options={{ strokeColor: '#0284c7', strokeWeight: 4, strokeOpacity: 0.85 }}
                />
              ))
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

      {roadLayers.length > 0 && (
        <RoadTrailLegend
          layers={roadLayers}
          calibrated={roadTrail?.calibrated}
          className="px-3 py-2"
        />
      )}

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
