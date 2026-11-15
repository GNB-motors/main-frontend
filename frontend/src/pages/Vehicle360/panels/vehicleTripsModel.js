/**
 * Vehicle trips — the pure part.
 *
 * Two backend sources describe a truck's running: the detected trip (plant →
 * plant, with its kilometre split) and the tour (the warehouse-to-warehouse
 * cycle that contains it). Rules of the house: an unknown is never a zero, and
 * an open tour carries no distance at all — a half-finished cycle is not a
 * measurable number, so it is shown as a position, never as "0 km".
 */

/** What we print when a figure was never measured. */
export const DASH = '—';

function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function stamp(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** The truck's live cycle, or null when it is parked. */
export function pickCurrentTour(tours) {
  const list = Array.isArray(tours) ? tours : [];
  return list.find((tour) => tour?.status === 'OPEN') || null;
}

/** When the trip happened — pickup departure is the best anchor we have. */
export function tripTime(trip) {
  return stamp(trip?.pickup?.departedAt) ?? stamp(trip?.createdAt) ?? stamp(trip?.completedAt);
}

/** The trips, newest first. */
export function sortTrips(trips) {
  const list = Array.isArray(trips) ? trips : [];
  return [...list].sort((a, b) => (tripTime(b) ?? 0) - (tripTime(a) ?? 0));
}

/**
 * The kilometre split of a trip. `total` is null unless at least one leg was
 * actually measured — a trip with no reading is unknown, not zero.
 */
export function tripKm(trip) {
  const km = trip?.km || {};
  const approach = num(km.approach);
  const laden = num(km.laden);
  const back = num(km.return);
  const fuelDetour = num(km.fuelDetour);
  const parts = [approach, laden, back].filter((value) => value !== null);
  return {
    approach,
    laden,
    back,
    fuelDetour,
    total: parts.length ? parts.reduce((sum, value) => sum + value, 0) : null,
  };
}

/** Where the truck went, and where it came back to. */
export function tripRoute(trip) {
  return {
    from: trip?.pickup?.name || null,
    to: trip?.drop?.name || null,
  };
}

/** Pill tone for a trip status: on the road, done, needs a look, or dropped. */
export function tripStatusTone(status) {
  switch (status) {
    case 'OPEN':
      return 'warn';
    case 'COMPLETE':
    case 'CONFIRMED':
      return 'ok';
    case 'NEEDS_REVIEW':
      return 'warn';
    default:
      return 'grey';
  }
}

/** The tour's headline: where it started, where it is going, how far it has run. */
export function tourSummary(tour, stops) {
  const legs = Array.isArray(stops) ? stops : [];
  const first = legs[0] || null;
  const last = legs[legs.length - 1] || null;
  const distance = num(tour?.distanceKm);
  return {
    from: first?.from && first.from !== DASH ? first.from : null,
    to: last?.to && last.to !== DASH ? last.to : null,
    startedAt: tour?.startedAt || null,
    endedAt: tour?.endedAt || null,
    legs: legs.length,
    km: distance,
    // An open tour is not measured yet; saying "0 km" would be a lie.
    kmReason: distance === null ? 'not measured until the cycle closes' : null,
    ladenKm: num(tour?.ladenKm),
    emptyKm: num(tour?.emptyKm),
    emptyShare: num(tour?.emptyShare),
  };
}
