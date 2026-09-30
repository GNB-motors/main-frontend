/**
 * Pure: the "truck reached the drop — close the trip?" suggestion.
 *
 * GPS never closes a trip (suggest-only close policy). When the truck has been
 * inside the DO's drop fence for 30 min or more, the trip page offers to close it
 * and the close form starts from what GPS saw; a person confirms or corrects it.
 */

const OPEN_STATES = new Set(['PLACED', 'DISPATCHED']);

/** yyyy-mm-dd in IST, for a date input. */
export const istDateInput = (d) =>
  new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

/** The suggestion to show, or null when there is nothing to suggest. */
export function dropPrompt(trip, now = new Date()) {
  const drop = trip?.gpsDrop;
  if (!drop?.arrivedAt || trip.tripClosedAt || !OPEN_STATES.has(trip.state)) return null;
  const until = drop.leftAt ? new Date(drop.leftAt) : now;
  return {
    placeName: trip.dropName || trip.toLocation || 'the drop point',
    arrivedAt: drop.arrivedAt,
    leftAt: drop.leftAt || null,
    stillThere: !drop.leftAt,
    stayedMin: Math.max(0, Math.round((until - new Date(drop.arrivedAt)) / 60000)),
  };
}

/** Starting values for the close form: GPS's drop when it saw one, else today. */
export function closeDefaults(trip, now = new Date()) {
  const drop = trip?.gpsDrop;
  const at = drop?.leftAt || drop?.arrivedAt;
  return {
    unloadedAt: istDateInput(at || now),
    unloadLocation: (at && trip.dropName) || trip?.toLocation || '',
    fromGps: Boolean(at),
  };
}
