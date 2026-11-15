/**
 * trackLayersModel — what the map draws in Track mode.
 *
 * The rules are exact and they are here, in a pure module, so they can be
 * tested:
 *
 * 1. The path is drawn as segments coloured by what the truck was doing:
 *    laden, empty, plant-to-plant, unknown, or a gap with no signal.
 * 2. Overspeed is NEVER a red line. It is an orange circle marker.
 * 3. A detour is a red DIAMOND marker in normal Track mode; the red line
 *    belongs only to the detour detail screen.
 * 4. Stops are round pins, coloured and pictured by their reason.
 * 5. Landmarks are small grey pins; the name appears at zoom 13.
 *
 * The model turns a track response into layer specs. The map component
 * only draws what it is given, so the rules cannot drift.
 */

/** The segment styles, exactly as the product decided them. */
export const SEGMENT_STYLES = {
  LADEN: { color: 'var(--rd-leg-loaded)', width: 5, dash: null, opacity: 1 },
  EMPTY: { color: 'var(--rd-leg-empty)', width: 4, dash: [6, 6], opacity: 1 },
  REPOSITION: { color: 'var(--rd-leg-reposition)', width: 4, dash: [2, 6], opacity: 1 },
  UNKNOWN: { color: 'var(--rd-leg-unknown)', width: 4, dash: null, opacity: 1 },
  GAP: { color: 'var(--rd-leg-unknown)', width: 2, dash: [2, 8], opacity: 0.5 },
};

/** The stop markers, by reason. */
export const STOP_MARKERS = {
  LOADING: { color: 'var(--rd-pl-plant)', icon: 'package-plus' },
  UNLOADING: { color: 'var(--rd-leg-loaded)', icon: 'package-minus' },
  FUEL: { color: 'var(--rd-pl-pump)', icon: 'fuel' },
  REST: { color: 'var(--rd-pl-dhaba)', icon: 'coffee' },
  OVERNIGHT: { color: 'var(--rd-ink-2)', icon: 'moon' },
  QUEUE: { color: 'var(--rd-watch)', icon: 'hourglass' },
  WORKSHOP: { color: 'var(--rd-pl-workshop)', icon: 'wrench' },
  UNEXPLAINED: { color: 'var(--rd-ink-3)', icon: 'help' },
};

/** The event markers, by kind. */
export const EVENT_MARKERS = {
  OVERSPEED: { color: 'var(--rd-overspeed)', shape: 'circle', size: 10, stroke: '#ffffff', strokeWidth: 2 },
  DETOUR: { color: 'var(--rd-detour)', shape: 'diamond', size: 10 },
  FUEL_FILL: { color: 'var(--rd-leg-loaded)', shape: 'circle', size: 9 },
  FUEL_DROP: { color: 'var(--rd-leg-reposition)', shape: 'circle', size: 9 },
  GPS_GAP: { color: 'var(--rd-ink-3)', shape: 'square', size: 9 },
  HARSH: { color: 'var(--rd-watch)', shape: 'circle', size: 9 },
};

/**
 * The path segments, ready to draw.
 * Each one knows its colour, its width and whether it is dashed.
 */
export function pathSegments(track) {
  const segments = Array.isArray(track?.segments) ? track.segments : [];
  const points = Array.isArray(track?.points) ? track.points : [];

  return segments.map((segment) => {
    const style = SEGMENT_STYLES[segment.kind] || SEGMENT_STYLES.UNKNOWN;
    const path = points
      .filter((point) => point.t >= segment.fromT && point.t <= segment.toT)
      .map((point) => ({ lat: point.lat, lng: point.lng }));
    return {
      key: `${segment.fromT}-${segment.toT}`,
      kind: segment.kind,
      path,
      color: style.color,
      width: style.width,
      dash: style.dash,
      opacity: style.opacity,
      caption: segment.kind === 'GAP' ? gapCaption(segment) : null,
    };
  });
}

/** The caption a gap carries: "No signal 1 h 10 min". */
export function gapCaption(segment) {
  const start = new Date(segment.fromT).getTime();
  const end = new Date(segment.toT).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 'No signal';
  const minutes = Math.round((end - start) / 60000);
  if (minutes < 60) return `No signal ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `No signal ${hours} h` : `No signal ${hours} h ${rest} min`;
}

/**
 * The overspeed markers.
 * The model returns MARKERS, never a path: an overspeed is a point in
 * time, not a stretch of road, and it is never a red line.
 */
export function overspeedMarkers(track) {
  const events = Array.isArray(track?.events) ? track.events : [];
  return events
    .filter((event) => event.kind === 'OVERSPEED')
    .map((event) => ({
      key: `overspeed-${event.at}`,
      kind: 'OVERSPEED',
      lat: event.lat,
      lng: event.lng,
      color: EVENT_MARKERS.OVERSPEED.color,
      shape: EVENT_MARKERS.OVERSPEED.shape,
      size: EVENT_MARKERS.OVERSPEED.size,
      stroke: EVENT_MARKERS.OVERSPEED.stroke,
      strokeWidth: EVENT_MARKERS.OVERSPEED.strokeWidth,
      title: event.text,
      at: event.at,
    }));
}

/**
 * The detour markers.
 * In normal Track mode a detour is a red diamond. The red LINE is only
 * drawn on the detour detail screen, where the off-road part is known.
 */
export function detourMarkers(track) {
  const events = Array.isArray(track?.events) ? track.events : [];
  return events
    .filter((event) => event.kind === 'DETOUR')
    .map((event) => ({
      key: `detour-${event.at}`,
      kind: 'DETOUR',
      lat: event.lat,
      lng: event.lng,
      color: EVENT_MARKERS.DETOUR.color,
      shape: EVENT_MARKERS.DETOUR.shape,
      size: EVENT_MARKERS.DETOUR.size,
      title: event.text,
      at: event.at,
    }));
}

/** The other event markers — fills, drops, gaps and harsh driving. */
export function otherEventMarkers(track) {
  const events = Array.isArray(track?.events) ? track.events : [];
  return events
    .filter((event) => event.kind !== 'OVERSPEED' && event.kind !== 'DETOUR')
    .map((event) => ({
      key: `${event.kind}-${event.at}`,
      kind: event.kind,
      lat: event.lat,
      lng: event.lng,
      color: EVENT_MARKERS[event.kind]?.color ?? 'var(--rd-ink-3)',
      shape: EVENT_MARKERS[event.kind]?.shape ?? 'circle',
      size: EVENT_MARKERS[event.kind]?.size ?? 9,
      title: event.text,
      at: event.at,
    }));
}

/** The stop pins, coloured and pictured by their reason. */
export function stopMarkers(track) {
  const stops = Array.isArray(track?.stops) ? track.stops : [];
  return stops.map((stop, index) => ({
    key: `stop-${stop.startAt}-${index}`,
    lat: stop.place?.lat ?? null,
    lng: stop.place?.lng ?? null,
    color: STOP_MARKERS[stop.reason]?.color ?? STOP_MARKERS.UNEXPLAINED.color,
    icon: STOP_MARKERS[stop.reason]?.icon ?? STOP_MARKERS.UNEXPLAINED.icon,
    size: 18,
    title: stop.place?.name ?? 'Stop',
    reason: stop.reason,
    reasonWhy: stop.reasonWhy ?? null,
    durationMin: stop.durationMin ?? null,
    at: stop.startAt,
  }));
}

/** The landmark pins. The name only shows at zoom 13. */
export function landmarkMarkers(track, zoom = 0) {
  const landmarks = Array.isArray(track?.landmarks) ? track.landmarks : [];
  const showName = Number(zoom) >= 13;
  return landmarks.map((landmark) => ({
    key: `landmark-${landmark.id}`,
    lat: landmark.lat,
    lng: landmark.lng,
    size: 12,
    color: 'var(--rd-ink-3)',
    label: showName ? landmark.name : null,
    title: landmark.name,
  }));
}

/**
 * The whole layer set for one track response.
 * The map draws these and nothing else.
 */
export function buildTrackLayers(track, { zoom = 0 } = {}) {
  return {
    segments: pathSegments(track),
    overspeed: overspeedMarkers(track),
    detours: detourMarkers(track),
    events: otherEventMarkers(track),
    stops: stopMarkers(track),
    landmarks: landmarkMarkers(track, zoom),
  };
}

/**
 * The playhead's position and heading at a moment in time.
 * The heading comes from the two points around it, so the truck marker
 * points where it was actually going.
 */
export function playheadAt(points, at) {
  const list = Array.isArray(points) ? points : [];
  if (!list.length) return null;
  const time = new Date(at).getTime();

  let index = list.findIndex((point) => new Date(point.t).getTime() >= time);
  if (index === -1) index = list.length - 1;

  const current = list[index];
  const next = list[Math.min(index + 1, list.length - 1)];
  const previous = list[Math.max(index - 1, 0)];

  let headingDeg = null;
  if (next && next !== current) {
    headingDeg = bearingBetween(current, next);
  } else if (previous && previous !== current) {
    headingDeg = bearingBetween(previous, current);
  }

  return {
    lat: current.lat,
    lng: current.lng,
    headingDeg,
    at: current.t,
    index,
    speedKmh: current.speedKmh ?? null,
    ignition: current.ign ?? null,
  };
}

/** The bearing from one point to another, in degrees clockwise from north. */
export function bearingBetween(from, to) {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const degrees = (Math.atan2(y, x) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

/**
 * The bounds of the path, so the map can fit itself to the drive.
 * Returns null when there is nothing to fit.
 */
export function pathBounds(points) {
  const list = Array.isArray(points) ? points : [];
  if (!list.length) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  list.forEach((point) => {
    if (point.lat < minLat) minLat = point.lat;
    if (point.lat > maxLat) maxLat = point.lat;
    if (point.lng < minLng) minLng = point.lng;
    if (point.lng > maxLng) maxLng = point.lng;
  });
  return { minLat, maxLat, minLng, maxLng };
}
