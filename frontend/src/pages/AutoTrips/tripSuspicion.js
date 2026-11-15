/**
 * A trip the server flagged as a suspicious unload.
 *
 * The flag means one thing only: the drop was inferred at a spot that is not a
 * known delivery point, and a person should look at it. It is not a finding of
 * wrongdoing and it is never worded as one — the screen says where to look,
 * not what happened. The owner decides what the stop was.
 */
import { toMeasured } from '@/utils/measured';

/** The flag the server sets on such a trip. */
export const SUSPICIOUS_UNLOAD_FLAG = 'SUSPICIOUS_UNLOAD';

/** The badge on the trip row and on the trip's page. */
export const SUSPICIOUS_UNLOAD_LABEL = 'Suspicious unload';

/** Why the badge is there, in words that do not accuse anyone. */
export const SUSPICIOUS_UNLOAD_REASON =
  'The drop was inferred at a spot that is not a known delivery point. A person should look at it — it is not a finding of wrongdoing.';

/** True when the server flagged this trip's drop as worth a look. */
export function isSuspiciousUnload(trip) {
  const flags = trip?.flags;
  return Array.isArray(flags) && flags.includes(SUSPICIOUS_UNLOAD_FLAG);
}

/**
 * The point on the map a person should look at: the trip's own drop.
 *
 * Null when the trip is not flagged, or when the drop carries no coordinates —
 * there is no point to put on the map, and we never invent one.
 */
export function suspiciousDropPoint(trip) {
  if (!isSuspiciousUnload(trip)) return null;
  const drop = trip?.drop;
  // A missing coordinate is unknown, not zero: `Number(null)` is 0, which
  // would put the pin in the Gulf of Guinea.
  const lat = toMeasured(drop?.lat);
  const lng = toMeasured(drop?.lng);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}
