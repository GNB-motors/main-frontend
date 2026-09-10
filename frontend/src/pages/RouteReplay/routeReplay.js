/**
 * routeReplay — pure geometry and playback maths over a breadcrumb trail.
 *
 * Source data is GET /api/livetracking/positions/:reg/trail, which returns
 * ordered points of { eventDateTime, latitude, longitude, speed, courseDegrees,
 * ignition, state }. Everything here is a pure function over that array so the
 * replay page stays presentational and this stays unit-testable (rule 21).
 *
 * Two customer requirements live in here rather than in the view:
 *  - a *playable* route: `positionAt` interpolates between fixes, so playback
 *    is smooth and time-accurate rather than hopping fix to fix;
 *  - speed measured against **actual ground covered**: `groundSpeedKmph`
 *    derives km/h from haversine distance over elapsed time between fixes,
 *    independent of whatever the device reported in `speed`. The two disagree
 *    when a device reports instantaneous speed but drops fixes, and the ground
 *    figure is the one that reconciles with distance travelled.
 */

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/** Great-circle distance between two {lat,lng} points, in kilometres. */
export function haversineKm(a, b) {
  if (!a || !b) return 0;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Initial bearing from a to b, in degrees clockwise from north. Used to face
 * the truck marker when the device did not report `courseDegrees`.
 */
export function bearingDeg(a, b) {
  if (!a || !b) return 0;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * GPS failure modes that must not reach the map:
 *  - the null island — a fix at exactly (0°, 0°) is a receiver cold-start
 *    artifact, not a position (no fleet operates at the equator/prime
 *    meridian intersection), and it used to pass both the null and the
 *    isFinite checks downstream;
 *  - teleports — a single glitched fix implying an impossible speed between
 *    two real fixes. It would draw a spike leg and poison every cumulative
 *    figure after it, and (once map-matching lands) poison match requests.
 * Trucks are governed far below this; anything implying more is bad data.
 */
export const MAX_IMPLIED_KMPH = 250;
const isNullIsland = (lat, lng) => lat === 0 && lng === 0;

/**
 * Trail rows → replay frames: drop fixes without coordinates or a usable
 * timestamp, sort chronologically, reject null-island and teleport fixes,
 * and annotate each surviving frame with the distance and ground speed
 * since the previous accepted fix.
 *
 * A trail can arrive unsorted (the history collection is append-only across
 * multiple ingest paths), and a single out-of-order fix would otherwise draw a
 * spike across the map and corrupt every cumulative figure after it.
 */
export function toFrames(points) {
  const clean = (Array.isArray(points) ? points : [])
    .filter((p) => p && p.latitude != null && p.longitude != null)
    .map((p) => ({
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      at: new Date(p.eventDateTime).getTime(),
      reportedSpeed: p.speed == null ? null : Number(p.speed),
      course: p.courseDegrees == null ? null : Number(p.courseDegrees),
      ignition: p.ignition ?? null,
      state: p.state ?? null,
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Number.isFinite(p.at))
    .sort((a, b) => a.at - b.at);

  const isTeleportLeg = (from, to) => {
    const implied = groundSpeedKmph(haversineKm(from, to), to.at - from.at);
    // implied is null when no time elapsed (two fixes, one timestamp) —
    // that says nothing about speed, so the leg is not a teleport.
    return implied != null && implied > MAX_IMPLIED_KMPH;
  };

  const accepted = [];
  for (let k = 0; k < clean.length; k += 1) {
    const p = clean[k];
    if (isNullIsland(p.lat, p.lng)) continue;
    const prev = accepted[accepted.length - 1];
    if (prev && isTeleportLeg(prev, p)) {
      // Leading-fix look-ahead: the FIRST fix is accepted unconditionally, so
      // a single glitched leading fix becomes the reference and every
      // subsequent real fix measures against it as a teleport — one bad fix
      // silently eats the whole trail. If p agrees with the following fix
      // while prev contradicts it, prev is the outlier: drop prev and let p
      // anchor the trail. Anything else is an ordinary mid-trail teleport —
      // drop p.
      const next = clean[k + 1];
      if (
        accepted.length === 1 &&
        next &&
        !isNullIsland(next.lat, next.lng) &&
        !isTeleportLeg(p, next) &&
        isTeleportLeg(prev, next)
      ) {
        accepted.pop();
        accepted.push(p);
        continue;
      }
      continue;
    }
    accepted.push(p);
  }

  let cumulativeKm = 0;
  return accepted.map((p, i) => {
    const prev = i === 0 ? null : accepted[i - 1];
    const legKm = prev ? haversineKm(prev, p) : 0;
    const legMs = prev ? p.at - prev.at : 0;
    cumulativeKm += legKm;
    return {
      ...p,
      legKm,
      cumulativeKm,
      groundSpeedKmph: groundSpeedKmph(legKm, legMs),
      heading: p.course != null ? p.course : prev ? bearingDeg(prev, p) : 0,
    };
  });
}

/**
 * km/h from a leg's distance and duration — the "actual ground covered"
 * figure. Returns null rather than 0 when the leg has no elapsed time: two
 * fixes sharing a timestamp say nothing about speed, and a printed 0 would
 * read as "stationary".
 */
export function groundSpeedKmph(legKm, legMs) {
  if (!legMs || legMs <= 0) return null;
  return legKm / (legMs / 3600000);
}

/**
 * Rollup for the replay's stats strip. Distance is ground truth, not planned.
 *
 * Honesty rule (gap repair): legs touching an estimated frame are split out
 * into estimatedKm and NEVER enter distanceKm/avg/maxSpeed — an estimated
 * kilometre must not appear inside a "ground covered" number unlabeled.
 */
export function replayStats(frames) {
  if (!frames || frames.length === 0) {
    return {
      pointCount: 0,
      measuredKm: 0,
      estimatedKm: 0,
      distanceKm: 0,
      durationMs: 0,
      avgSpeedKmph: null,
      maxSpeedKmph: null,
    };
  }
  let measuredKm = 0;
  let estimatedKm = 0;
  let measuredMs = 0;
  let maxSpeedKmph = null;
  for (let i = 1; i < frames.length; i += 1) {
    const a = frames[i - 1];
    const b = frames[i];
    const legKm = haversineKm(a, b);
    const legMs = b.at - a.at;
    if (a.estimated || b.estimated) {
      estimatedKm += legKm;
      continue;
    }
    measuredKm += legKm;
    measuredMs += legMs;
    if (b.groundSpeedKmph != null) {
      maxSpeedKmph =
        maxSpeedKmph == null ? b.groundSpeedKmph : Math.max(maxSpeedKmph, b.groundSpeedKmph);
    }
  }
  const durationMs = frames[frames.length - 1].at - frames[0].at;
  return {
    pointCount: frames.length,
    measuredKm,
    estimatedKm,
    // distanceKm stays the measured "ground covered" figure for the stats
    // strip; estimatedKm is reported alongside it, labeled.
    distanceKm: measuredKm,
    durationMs,
    // Averages over measured legs only, weighted by their own elapsed time.
    avgSpeedKmph: measuredMs > 0 ? measuredKm / (measuredMs / 3600000) : null,
    maxSpeedKmph,
  };
}

/**
 * Interpolated position at `progress` (0..1) across the trail's time span.
 * Interpolating on *time* rather than on point index keeps playback honest:
 * a vehicle parked for an hour should sit still for that hour, not skip ahead
 * because few fixes were recorded while it was stationary.
 */
export function positionAt(frames, progress) {
  if (!frames || frames.length === 0) return null;
  if (frames.length === 1) return { ...frames[0], index: 0 };

  const clamped = Math.min(1, Math.max(0, progress));
  const start = frames[0].at;
  const span = frames[frames.length - 1].at - start;
  if (span <= 0) return { ...frames[frames.length - 1], index: frames.length - 1 };

  const target = start + span * clamped;
  let i = 0;
  while (i < frames.length - 1 && frames[i + 1].at <= target) i += 1;
  if (i >= frames.length - 1) return { ...frames[frames.length - 1], index: frames.length - 1 };

  const a = frames[i];
  const b = frames[i + 1];
  const legMs = b.at - a.at;
  const t = legMs > 0 ? (target - a.at) / legMs : 0;
  // estimated must ride along so the "· estimated (corridor)" badge renders
  // mid-playback: a leg touching an estimated frame is estimated, even when
  // the other endpoint is measured.
  const estimated = Boolean(a.estimated || b.estimated);
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
    at: target,
    heading: b.heading,
    groundSpeedKmph: b.groundSpeedKmph,
    reportedSpeed: b.reportedSpeed,
    cumulativeKm: a.cumulativeKm + (b.cumulativeKm - a.cumulativeKm) * t,
    estimated,
    provenance: estimated ? (a.provenance ?? b.provenance) : undefined,
    index: i,
  };
}

/** Google Maps path for the drawn polyline. */
export const toLatLngPath = (frames) => (frames || []).map((f) => ({ lat: f.lat, lng: f.lng }));
