import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { GoogleMap, MarkerF, PolylineF, useLoadScript } from '@react-google-maps/api';
import { Pause, Play } from 'lucide-react';
import { createVehicleMarkerIcon } from '../LiveTracking/liveTracking.shared.js';
import { positionAt, toFrames, toLatLngSegments } from '../RouteReplay/routeReplay';
import { fmtClock, fmtDayTime, routeMapPoints, stopKind } from './autoTripModel';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const CONTAINER = { width: '100%', height: '100%' };
const INDIA = { lat: 22.9734, lng: 78.6569 };
/** At 1× the replay plays one minute of the trip every second; 10× and 50× scale up. */
const TRIP_MS_PER_MS = 60;
const SPEEDS = [1, 10, 50];
/** Heading snapped to 5° so the truck icon is rebuilt only when it visibly turns, not every frame. */
const HEADING_STEP = 5;
const MOVING_KMPH = 3;
const COLOR = {
  trail: '#CBD5E1',
  run: '#1D4ED8',
  plant: '#0F172A',
  drop: '#15803D',
  unknown: '#B45309',
  stop: '#64748B',
};
/** A quiet, light basemap so the route reads first. */
const MAP_THEME = [
  { elementType: 'geometry', stylers: [{ color: '#eef2ec' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f7f8fa' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
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
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    className: 'atx-map-label',
  };
}

/**
 * The trip on a map with a replay: the whole GPS track in grey, the part driven so far
 * in blue, and the truck moving along it. Playback interpolates on time, so a parked
 * truck stays parked; across a GPS gap it holds at the last fix instead of flying.
 * The parent jumps the replay with `ref.current.playFrom(time)`.
 */
export default function AutoTripReplay({ trip, track, loading, error, autoPlay = false, ref }) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const mapRef = useRef(null);
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
  const fullSegments = useMemo(() => toLatLngSegments(frames), [frames]);
  const runSegments = useMemo(() => {
    if (!head || !canPlay) return [];
    const segs = toLatLngSegments(frames, head.index);
    const next = frames[head.index + 1];
    if (segs.length && next && !next.isBreak) {
      segs[segs.length - 1] = [...segs[segs.length - 1], { lat: head.lat, lng: head.lng }];
    }
    return segs;
  }, [frames, head, canPlay]);

  const pts = useMemo(() => routeMapPoints(trip || {}), [trip]);
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
    return {
      plant: circle(COLOR.plant, 10, '#FFFFFF', 2, 3),
      drop: circle(COLOR.drop, 10, '#FFFFFF', 2, 3),
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
  if (GOOGLE_MAPS_API_KEY) {
    if (loading && !track) chip = 'Loading GPS track…';
    else if (error && !track) chip = 'Could not load the GPS track';
    else if (!frames.length) chip = 'No GPS track for this trip';
    else chip = `${fmtDayTime(head?.at)} · ${speedText(head)}`;
  }

  const lastAt = frames.length ? frames[frames.length - 1].at : null;
  const leftLabel = `Left plant ${fmtClock(trip?.pickup?.departedAt || (frames[0] && frames[0].at))}`;
  const rightLabel = track?.open
    ? `Last GPS ${fmtClock(lastAt || track?.to)}`
    : `Reached drop ${fmtClock(track?.to || trip?.drop?.arrivedAt)}`;

  return (
    <div ref={wrapRef}>
      <div className="atx-map">
        {!GOOGLE_MAPS_API_KEY ? (
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
              fit(map);
            }}
            onUnmount={() => {
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
              clickableIcons: false,
              styles: MAP_THEME,
            }}
          >
            {frames.length > 1
              ? fullSegments.map((seg, i) =>
                  seg.length > 1 ? (
                    <PolylineF key={`full-${i}`} path={seg} options={LINE(COLOR.trail, 1)} />
                  ) : null,
                )
              : pts.path.length > 1 && <PolylineF path={pts.path} options={LINE(COLOR.trail, 1)} />}
            {runSegments.map((seg, i) =>
              seg.length > 1 ? (
                <PolylineF key={`run-${i}`} path={seg} options={LINE(COLOR.run, 2)} />
              ) : null,
            )}
            {icons &&
              stopMarks.map((m) => (
                <MarkerF
                  key={m.id}
                  position={m.at}
                  icon={m.unknown ? icons.unknown : icons.stop}
                  title={m.unknown ? 'Unknown stop' : 'Stop'}
                  zIndex={3}
                />
              ))}
            {icons && pts.pickup ? (
              <MarkerF
                position={pts.pickup}
                icon={icons.plant}
                label={placeLabel(trip?.pickup?.name, COLOR.plant)}
                title={trip?.pickup?.name || 'Plant'}
                zIndex={4}
              />
            ) : null}
            {icons && pts.drop ? (
              <MarkerF
                position={pts.drop}
                icon={icons.drop}
                label={placeLabel(trip?.drop?.name, COLOR.drop)}
                title={trip?.drop?.name || 'Drop'}
                zIndex={4}
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
                  zIndex={4}
                />
              ))}
            {truckIcon && head ? (
              <MarkerF
                position={{ lat: head.lat, lng: head.lng }}
                icon={truckIcon}
                title="Truck"
                zIndex={10}
              />
            ) : null}
          </GoogleMap>
        ) : null}
        {chip ? <span className="atx-map-chip">{chip}</span> : null}
      </div>

      <div className="atx-player">
        <button
          type="button"
          className="atx-play"
          onClick={togglePlay}
          disabled={!canPlay}
          aria-label={playing ? 'Pause replay' : 'Play replay'}
        >
          {playing ? (
            <Pause size={16} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={16} fill="currentColor" strokeWidth={0} />
          )}
        </button>
        <label className="atx-scrub">
          <span className="atx-sr">Replay position</span>
          <input
            type="range"
            aria-label="Replay position"
            min={0}
            max={1000}
            step={1}
            value={Math.round(progress * 1000)}
            disabled={!canPlay}
            onChange={(e) => {
              setPlaying(false);
              seekTo((Number(e.target.value) / 1000) * span);
            }}
          />
          <span className="atx-scrub-labels">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </span>
        </label>
        <div role="group" aria-label="Replay speed" className="atx-speeds">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={speed === s}
              aria-label={`Play at ${s}× speed`}
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
