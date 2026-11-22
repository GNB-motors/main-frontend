/**
 * A truck that reported its position all day without going anywhere is a real
 * answer, not a broken measurement. These helpers keep the two apart so the
 * screen can say it in words instead of leaving a bare "0 km" behind, which
 * reads like a sensor that broke.
 */

/** The plain-words answer for a vehicle that never moved in the selected window. */
export const NO_MOVEMENT = 'No movement in this period';

/**
 * True when the trip has a measured distance of (almost) nothing and no speed
 * was ever recorded.
 *
 * An UNKNOWN distance is not "no movement" — that is a missing measurement and
 * has to be labelled as one, never as a vehicle that stood still.
 */
export function isNoMovement(trip) {
  if (!trip) return false;
  const km = Number(trip.km);
  const avg = Number(trip.avg);
  if (!Number.isFinite(km)) return false; // unknown distance is not a standstill
  if (km >= 0.05) return false; // it travelled
  if (Number.isFinite(avg) && avg > 0) return false; // it was moving at some point
  return true;
}

export default isNoMovement;
