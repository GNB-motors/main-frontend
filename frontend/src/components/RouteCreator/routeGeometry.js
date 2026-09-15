/**
 * routeGeometry — pure polyline encode/decode and Directions-result shaping.
 *
 * Saved routes persist a Google encoded polyline (precision-5) plus its
 * bounds so a route can be redrawn later without re-querying Directions.
 * Everything here is a pure function so the components stay presentational
 * and this stays unit-testable (rule 21).
 *
 * The polyline scheme is Google's varint encoding: each point is a lat/lng
 * delta from the previous point, quantized to 1e-5 degrees, signed via the
 * "invert on low bit" trick, then emitted 5 bits per character at charCode
 * offset 63 ('?'..'~').
 */

const DEFAULT_PRECISION = 5;

const readCoord = (point, key) => {
  if (!point) return null;
  const value = typeof point[key] === 'function' ? point[key]() : point[key];
  return Number.isFinite(value) ? value : null;
};

const encodeSigned = (value) => {
  let shifted = value < 0 ? ~(value << 1) : value << 1;
  let chunk = '';
  while (shifted >= 0x20) {
    chunk += String.fromCharCode((0x20 | (shifted & 0x1f)) + 63);
    shifted >>= 5;
  }
  return chunk + String.fromCharCode(shifted + 63);
};

/** Encode [{lat, lng}] (or LatLng-like objects) as a precision-N encoded polyline. */
export function encodePolyline(points, precision = DEFAULT_PRECISION) {
  const factor = 10 ** precision;
  let prevLat = 0;
  let prevLng = 0;
  let result = '';
  for (const point of points || []) {
    const rawLat = readCoord(point, 'lat');
    const rawLng = readCoord(point, 'lng');
    if (rawLat == null || rawLng == null) continue;
    const lat = Math.round(rawLat * factor);
    const lng = Math.round(rawLng * factor);
    result += encodeSigned(lat - prevLat) + encodeSigned(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }
  return result;
}

const decodeSignedDelta = (encoded, state) => {
  let result = 0;
  let shift = 0;
  let byte;
  do {
    byte = encoded.charCodeAt(state.index) - 63;
    state.index += 1;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20 && state.index < encoded.length);
  return result & 1 ? ~(result >> 1) : result >> 1;
};

/** Decode a precision-N encoded polyline into plain [{lat, lng}] points. */
export function decodePolyline(encoded, precision = DEFAULT_PRECISION) {
  if (typeof encoded !== 'string' || !encoded) return [];
  const factor = 10 ** precision;
  const path = [];
  const state = { index: 0 };
  let lat = 0;
  let lng = 0;
  while (state.index < encoded.length) {
    lat += decodeSignedDelta(encoded, state);
    lng += decodeSignedDelta(encoded, state);
    path.push({ lat: lat / factor, lng: lng / factor });
  }
  return path;
}

/**
 * Encoded polyline from a DirectionsRoute. The JS API exposes
 * overview_polyline as a plain string, but the shape {points: string} shows
 * up in other surfaces — accept both. When only the decoded overview_path
 * (array of LatLng) is available, encode it rather than persisting JSON.
 */
export function extractEncodedPolyline(route) {
  const overview = route?.overview_polyline;
  if (typeof overview === 'string' && overview) return overview;
  if (overview && typeof overview.points === 'string' && overview.points) return overview.points;
  if (Array.isArray(route?.overview_path) && route.overview_path.length > 0) {
    return encodePolyline(route.overview_path);
  }
  return null;
}

/** {north, south, east, west} from a DirectionsRoute bounds (LatLngBounds or literal). */
export function extractBounds(route) {
  const bounds = route?.bounds;
  if (!bounds) return null;
  const ne =
    typeof bounds.getNorthEast === 'function' ? bounds.getNorthEast() : bounds.getNorthEast;
  const sw =
    typeof bounds.getSouthWest === 'function' ? bounds.getSouthWest() : bounds.getSouthWest;
  const north = readCoord(ne, 'lat');
  const south = readCoord(sw, 'lat');
  const east = readCoord(ne, 'lng');
  const west = readCoord(sw, 'lng');
  if ([north, south, east, west].some((v) => v == null)) return null;
  return { north, south, east, west };
}

/**
 * DirectionsRoute → the persisted geometry object. `fetchedAt` is injectable
 * so tests are deterministic; production callers default to "now".
 */
export function buildRouteGeometry(
  route,
  { distanceMeters = null, fetchedAt = new Date().toISOString() } = {},
) {
  const overviewPath = Array.isArray(route?.overview_path) ? route.overview_path : null;
  return {
    encodedPolyline: extractEncodedPolyline(route),
    bounds: extractBounds(route),
    pointCount: overviewPath ? overviewPath.length : null,
    provider: 'GOOGLE_DIRECTIONS',
    fetchedAt,
    distanceMeters,
  };
}

/** Smallest bounds containing every {north, south, east, west}; null when none are usable. */
export function unionBounds(boundsList) {
  const valid = (boundsList || []).filter(
    (b) => b && ['north', 'south', 'east', 'west'].every((k) => Number.isFinite(b[k])),
  );
  if (valid.length === 0) return null;
  return {
    north: Math.max(...valid.map((b) => b.north)),
    south: Math.min(...valid.map((b) => b.south)),
    east: Math.max(...valid.map((b) => b.east)),
    west: Math.min(...valid.map((b) => b.west)),
  };
}
