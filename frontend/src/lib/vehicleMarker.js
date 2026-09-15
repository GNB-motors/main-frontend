/**
 * Vehicle marker geometry — pure, unit-tested.
 * The 2-D directional marker is the MANDATORY fallback for 3-D trucks:
 * it must render the truck's heading and status with zero dependencies
 * and weigh nothing. 3-D (deck.gl ScenegraphLayer) layers on top later,
 * inside a lazy route-level chunk, never in the main bundle.
 */

/** Map a compass bearing (degrees clockwise from north) to SVG rotation. */
export function bearingToRotation(bearing) {
  const b = Number(bearing);
  if (!Number.isFinite(b)) return 0;
  return ((b % 360) + 360) % 360;
}

/**
 * Tone for a vehicle state — one of the four reserved signal colours.
 * Unknown/absent states are 'inert'; tone never guesses something is wrong.
 */
export function markerTone(state) {
  const { status, isStale, alertSeverity } = state || {};
  if (alertSeverity === 'CRITICAL' || alertSeverity === 'WARNING') return 'critical';
  if (isStale) return 'inert';
  // Absent status is not "healthy" — a marker with no signal data is inert.
  if (status === null || status === undefined || status === '') return 'inert';
  const s = String(status).toUpperCase();
  if (s === 'OFFLINE' || s === 'NO_SIGNAL') return 'inert';
  if (s === 'ACCIDENT_PRONE') return 'critical';
  return 'ok';
}
