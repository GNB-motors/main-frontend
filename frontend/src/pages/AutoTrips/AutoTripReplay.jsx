import { googleMapsLoaderOptions } from '../../utils/googleMapsLoader.js';
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { GoogleMap, MarkerF, PolylineF, useLoadScript } from '@react-google-maps/api';
import { createVehicleMarkerIcon } from '../LiveTracking/vehicleMarkerIcon.js';
import { positionAt, toFrames } from '../RouteReplay/routeReplay';
import RoadTrailLayer from '../../components/map/RoadTrailLayer';
import { fmtClock, fmtDayTime } from './autoTripFormat';
import { routeMapPoints, tripRoadAt, tripRoadLayers } from './autoTripPlaces';
import { stopKind } from './timelineModel';
import ReplayPlayer from './ReplayPlayer';
import {
  PATH_COLORS,
  loadWindows,
  pathSegments,
  segmentPath,
  travelledSegments,
} from './tripPathModel';
import TollMarkers from './TollMarkers';
import { justPassed, tollMarks } from './tripTolls';
import { openInGoogleMaps } from '../../utils/googleMapsLink.js';

const CONTAINER = { width: '100%', height: '100%' };
const INDIA = { lat: 22.9734, lng: 78.6569 };
/** At 1× the replay plays one minute of the trip every second; 10× and 50× scale up. */
const TRIP_MS_PER_MS = 60;
/** Heading snapped to 5° so the truck icon is rebuilt only when it visibly turns, not every frame. */
const HEADING_STEP = 5;
const MOVING_KMPH = 3;
const COLOR = {
  trail: '#CBD5E1',
  detour: '#C2323A',
  /** The trip starts at the plant (green) and ends at the drop (red). */
  start: '#15803D',
  drop: '#DC2626',
  unknown: '#B45309',
  stop: '#64748B',
};
/** A quiet, light basemap so the route reads first — Google's own place labels stay on. */
const MAP_THEME = [
  { elementType: 'geometry', stylers: [{ color: '#eef2ec' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f7f8fa' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d4e2e8' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cbd5e1' }],
  },
];
const LINE = (color, zIndex) => ({ strokeColor: color, strokeOpacity: 1, strokeWeight: 6, zIndex });

/**
 * The driven path: solid indigo where the truck carried, dashed slate where it drove
 * empty. The part already driven is drawn opaque over the faded rest of the trip.
 */
const pathStyle = (load, opacity, zIndex) =>
  load === 'empty'
    ? {
        strokeColor: PATH_COLORS.empty,
        strokeOpacity: 0,
        strokeWeight: 3,
        zIndex,
        icons: [
          {
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: opacity,
              strokeColor: PATH_COLORS.empty,
              strokeWeight: 3,
              scale: 2,
            },
            offset: '0',
            repeat: '10px',
          },
        ],
      }
    : { strokeColor: PATH_COLORS.loaded, strokeOpacity: opacity, strokeWeight: 4, zIndex };

const headKmph = (head) => head?.reportedSpeed ?? head?.groundSpeedKmph;

function speedText(head) {
  const kmph = headKmph(head);
  return kmph == null ? '— km/h' : `${Math.round(kmph)} km/h`;
}

function placeLabel(text, color) {
  if (!text) return undefined;
  return {
    text,
    color,
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'var(--font-sans, Inter, sans-serif)',
    className: 'atx-map-label',
  };
}

/**
 * The trip on a map with a replay: the whole route in grey, the part driven so far in
 * blue, and the truck moving along it. When our road engine matched the trip
 * (`roadTrail`), the route is the road itself and a GPS gap follows the road the fleet
 * drives; otherwise the GPS line, held at the last fix across a gap. Playback
 * interpolates on time, so a parked truck stays parked.
 * `detours` ([{ id, path }]) are stretches that left the usual route, drawn red on top.
 * The parent jumps the replay with `ref.current.playFrom(time)`.
 */
export default function AutoTripReplay({
  trip,
  track,
  roadTrail = null,
  detours = null,
  tolls = null,
  loading,
  error,
  autoPlay = false,
  ref,
}) {
  const { isLoaded } = useLoadScript(googleMapsLoaderOptions);
  const mapRef = useRef(null);
  const poiClickRef = useRef(null);
  const wrapRef = useRef(null);

  const frames = useMemo(() => toFrames(track?.points), [track]);
  const start = frames.length ? frames[0].at : 0;
  const span = frames.length > 1 ? frames[frames.length - 1].at - start : 0;
  const canPlay = span > 0;

  const [cursor, setCursor] = useState(0); // ms into the track
  const [playing, setPlaying] = useState(() => Boolean(autoPlay) && canPlay);
  const [speed, setSpeed] = useState(10);
  const [zoom, setZoom] = useState(9);
  const cursorRef = useRef(0);

  // A new track starts the replay over (and plays it when opened from "Replay").
  const trackKey = track ? `${track.tripId}|${track.from}|${track.to}|${frames.length}` : '';
  const [seenKey, setSeenKey] = useState(trackKey);
  if (seenKey !== trackKey) {
    setSeenKey(trackKey);
    setCursor(0);
    setPlaying(Boolean(autoPlay) && canPlay);
  }

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    if (!playing || !canPlay) return undefined;
    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      const next = Math.min(span, cursorRef.current + (now - last) * TRIP_MS_PER_MS * speed);
      last = now;
      cursorRef.current = next;
      setCursor(next);
      if (next >= span) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, span, canPlay]);

  const seekTo = useCallback(
    (ms) => {
      const next = Math.min(span, Math.max(0, ms));
      cursorRef.current = next;
      setCursor(next);
    },
    [span],
  );

  useImperativeHandle(
    ref,
    () => ({
      playFrom(at) {
        if (!canPlay) return;
        seekTo(new Date(at).getTime() - start);
        setPlaying(true);
        wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    }),
    [canPlay, seekTo, start],
  );

  const progress = canPlay ? cursor / span : 0;
  const head = useMemo(
    () => (frames.length ? positionAt(frames, progress) : null),
    [frames, progress],
  );
  const windows = useMemo(() => loadWindows(trip), [trip]);
  const segments = useMemo(() => pathSegments(frames, windows), [frames, windows]);
  const runSegments = useMemo(() => travelledSegments(segments, head), [segments, head]);

  const roadLayers = useMemo(() => tripRoadLayers(roadTrail), [roadTrail]);
  const onRoad = useMemo(
    () => (roadLayers && head ? tripRoadAt(roadLayers, head.at) : null),
    [roadLayers, head],
  );
  const truckAt = onRoad?.truckAt || head;

  const pts = useMemo(() => routeMapPoints(trip || {}), [trip]);
  const marks = tollMarks(tolls?.passes, head?.at);
  const windowEnd = track?.to ? new Date(track.to).getTime() : null;
  const stopMarks = useMemo(() => {
    const byId = new Map((trip?.routeStops || []).map((s) => [String(s._id), s]));
    return pts.stops
      .map((m) => ({ ...m, stop: byId.get(String(m.id)) }))
      .filter((m) => !windowEnd || !m.stop || new Date(m.stop.startAt).getTime() <= windowEnd)
      .map((m) => ({ ...m, unknown: stopKind(m.stop) === 'UNKNOWN' }));
  }, [pts, trip, windowEnd]);

  const fit = useCallback(
    (map) => {
      if (!map || !window.google) return;
      const bounds = new window.google.maps.LatLngBounds();
      let n = 0;
      const add = (p) => {
        bounds.extend({ lat: p.lat, lng: p.lng });
        n += 1;
      };
      const step = Math.max(1, Math.floor(frames.length / 400));
      for (let i = 0; i < frames.length; i += step) add(frames[i]);
      if (frames.length) add(frames[frames.length - 1]);
      else pts.path.forEach(add);
      [pts.pickup, pts.drop, ...pts.extras.map((x) => x.at)].filter(Boolean).forEach(add);
      if (n > 1) map.fitBounds(bounds, 48);
      else if (n === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(12);
      }
    },
    [frames, pts],
  );

  useEffect(() => {
    fit(mapRef.current);
  }, [fit]);

  const icons = useMemo(() => {
    if (!isLoaded || !window.google) return null;
    const { SymbolPath, Point } = window.google.maps;
    const circle = (fill, scale, stroke, strokeWeight, labelY) => ({
      path: SymbolPath.CIRCLE,
      scale,
      fillColor: fill,
      fillOpacity: 1,
      strokeColor: stroke,
      strokeWeight,
      ...(labelY != null ? { labelOrigin: new Point(0, labelY) } : {}),
    });
    // The start and the drop are pins, so they read as where the trip began and where
    // it ended rather than as one more stop on the route.
    const pin = (fill) => ({
      path: 'M 0,-14 C -7.5,-14 -13,-8.5 -13,-1 C -13,6 0,14 0,14 C 0,14 13,6 13,-1 C 13,-8.5 7.5,-14 0,-14 Z',
      fillColor: fill,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      anchor: new Point(0, 14),
      labelOrigin: new Point(0, -30),
    });
    return {
      start: pin(COLOR.start),
      drop: pin(COLOR.drop),
      unknown: circle('#FFFFFF', 7, COLOR.unknown, 3),
      stop: circle('#FFFFFF', 5, COLOR.stop, 2),
    };
  }, [isLoaded]);

  // The same truck as Live Tracking: faces its heading, green while moving, purple while parked.
  const truckMoving = (headKmph(head) ?? 0) > MOVING_KMPH;
  const truckHeading = (Math.round((head?.heading || 0) / HEADING_STEP) * HEADING_STEP) % 360;
  const truckIcon = useMemo(
    () =>
      isLoaded && window.google
        ? createVehicleMarkerIcon({
            status: truckMoving ? 'moving' : 'stopped',
            courseDegrees: truckHeading,
            zoom,
          })
        : null,
    [isLoaded, truckMoving, truckHeading, zoom],
  );

  const togglePlay = () => {
    if (!canPlay) return;
    if (cursorRef.current >= span) seekTo(0);
    setPlaying((p) => !p);
  };

  let chip = null;
  if (googleMapsLoaderOptions.googleMapsApiKey) {
    if (loading && !track) chip = 'Loading GPS track…';
    else if (error && !track) chip = 'Could not load the GPS track';
    else if (!frames.length) chip = 'No GPS track for this trip';
    else {
      const crossed = justPassed(tolls?.passes, head?.at);
      chip = `${fmtDayTime(head?.at)} · ${speedText(head)}${crossed ? ` · ${crossed}` : ''}`;
    }
  }

  const lastAt = frames.length ? frames[frames.length - 1].at : null;
  const leftLabel = `Left plant ${fmtClock(trip?.pickup?.departedAt || (frames[0] && frames[0].at))}`;
  const rightLabel = track?.open
    ? `Last GPS ${fmtClock(lastAt || track?.to)}`
    : trip?.leg === 'REPOSITION'
      ? `Reached next plant ${fmtClock(trip?.movementEnd?.arrivedAt || track?.to)}`
      : `Reached drop ${fmtClock(track?.to || trip?.drop?.arrivedAt)}`;

  return (
    <div ref={wrapRef} className="atx-replay">
      <div className="atx-map">
        {!googleMapsLoaderOptions.googleMapsApiKey ? (
          <div className="atx-map-empty">
            <strong>Map unavailable</strong>
            <span>No Google Maps key is configured.</span>
          </div>
        ) : isLoaded ? (
          <GoogleMap
            mapContainerStyle={CONTAINER}
            center={pts.pickup || pts.drop || INDIA}
            zoom={9}
            onLoad={(map) => {
              mapRef.current = map;
              // Clicking one of Google's own POIs opens it in Google Maps
              // instead of Google's info window.
              poiClickRef.current?.remove();
              poiClickRef.current = map.addListener('click', (e) => {
                if (!e.placeId) return;
                e.stop();
                openInGoogleMaps({ lat: e.latLng.lat(), lng: e.latLng.lng(), placeId: e.placeId });
              });
              fit(map);
            }}
            onUnmount={() => {
              poiClickRef.current?.remove();
              poiClickRef.current = null;
              mapRef.current = null;
            }}
            onZoomChanged={() => {
              const z = mapRef.current?.getZoom();
              if (z != null) setZoom(z);
            }}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              gestureHandling: 'cooperative',
              clickableIcons: true,
              styles: MAP_THEME,
            }}
          >
            {roadLayers && <RoadTrailLayer layers={roadLayers} color={COLOR.trail} />}
            {segments.map((seg, i) =>
              seg.points.length > 1 ? (
                <PolylineF
                  key={`path-${i}`}
                  path={segmentPath(seg)}
                  options={pathStyle(seg.load, 0.35, 4)}
                />
              ) : null,
            )}
            {runSegments.map((seg, i) =>
              seg.path.length > 1 ? (
                <PolylineF key={`run-${i}`} path={seg.path} options={pathStyle(seg.load, 1, 5)} />
              ) : null,
            )}
            {!frames.length && pts.path.length > 1 && (
              <PolylineF
                path={pts.path}
                options={{
                  strokeColor: COLOR.trail,
                  strokeOpacity: 0.9,
                  strokeWeight: 3,
                  zIndex: 4,
                }}
              />
            )}
            {(detours || []).map((d) => (
              <PolylineF key={`detour-${d.id}`} path={d.path} options={LINE(COLOR.detour, 6)} />
            ))}
            {icons &&
              stopMarks.map((m) => (
                <MarkerF
                  key={m.id}
                  position={m.at}
                  icon={m.unknown ? icons.unknown : icons.stop}
                  title={m.unknown ? 'Unknown stop' : 'Stop'}
                  zIndex={7}
                />
              ))}
            {icons && pts.pickup ? (
              <MarkerF
                position={pts.pickup}
                icon={icons.start}
                label={placeLabel(trip?.pickup?.name, COLOR.start)}
                title={trip?.pickup?.name || 'Plant'}
                zIndex={12}
              />
            ) : null}
            {icons && pts.drop ? (
              <MarkerF
                position={pts.drop}
                icon={icons.drop}
                label={placeLabel(trip?.drop?.name, COLOR.drop)}
                title={trip?.drop?.name || 'Drop'}
                zIndex={12}
              />
            ) : null}
            {icons &&
              pts.extras.map((x) => (
                <MarkerF
                  key={x.id}
                  position={x.at}
                  icon={icons.drop}
                  label={placeLabel(x.label, COLOR.drop)}
                  title="Further drop"
                  zIndex={12}
                />
              ))}
            <TollMarkers marks={marks} />
            {truckIcon && head ? (
              <MarkerF
                position={{ lat: truckAt.lat, lng: truckAt.lng }}
                icon={truckIcon}
                title="Truck"
                zIndex={10}
              />
            ) : null}
          </GoogleMap>
        ) : null}
        {chip ? <span className="atx-map-chip">{chip}</span> : null}
      </div>

      <ReplayPlayer
        togglePlay={togglePlay}
        canPlay={canPlay}
        playing={playing}
        progress={progress}
        setPlaying={setPlaying}
        seekTo={seekTo}
        span={span}
        leftLabel={leftLabel}
        rightLabel={rightLabel}
        speed={speed}
        setSpeed={setSpeed}
      />
    </div>
  );
}
