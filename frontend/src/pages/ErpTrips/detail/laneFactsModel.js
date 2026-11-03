/**
 * Lane time, toll quote and tour — the pure part.
 *
 * Everything here is a formatter over a payload the backend returned. The
 * rules are the same everywhere: an unknown is never a zero, and a missing
 * lane is not a fast lane.
 */

/** What we say when the road engine is down or there is no quote at all. */
export const TOLL_UNAVAILABLE = 'Toll estimate unavailable';
/** What we say when the lane has never been driven (or we do not know it). */
export const NO_LANE_HISTORY = 'No history on this lane yet';
/** What we say when the trip does not carry both ends of the lane. */
export const NO_LANE_KNOWN = 'Both ends of this lane are not known';
/** What we say when the truck has no cycle on file. */
export const NO_TOUR = 'No tour on file for this truck';
/** What we say when no truck is linked to the trip at all. */
export const NO_TRUCK = 'No truck linked to this trip';
/** The vehicle group a toll is priced for (a multi-axle truck). */
export const TOLL_GROUP = 'multiaxle';

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * The lane row, wherever the backend put it: a list of rows, a `{ stats }`
 * envelope, or the row itself.
 */
export function laneRow(payload) {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (payload.stats && typeof payload.stats === 'object') return payload.stats;
  if (payload.data) return laneRow(payload.data);
  return payload;
}

/**
 * "Usual on this lane: 6.2 h (slow days 8.9 h)".
 * Null when there is no row — the caller then says "no history on this lane".
 */
export function laneTimeLabel(payload) {
  const row = laneRow(payload);
  if (!row) return null;
  const p50 = numberOrNull(row.p50 ?? row.median);
  if (p50 === null) return null;
  const label = `Usual on this lane: ${p50.toFixed(1)} h`;
  const p90 = numberOrNull(row.p90);
  const withP90 = p90 === null ? label : `${label} (slow days ${p90.toFixed(1)} h)`;
  const sampleSize = numberOrNull(row.sampleSize);
  if (sampleSize !== null && sampleSize > 0 && sampleSize < 5) {
    return `${withP90} · only ${sampleSize} trip${sampleSize === 1 ? '' : 's'} on this lane`;
  }
  return withP90;
}

/**
 * "Toll estimate: ₹1,240 across 3 plazas".
 * Null when there is no quote to read — the caller then says "unavailable".
 */
export function tollQuoteLabel(payload, { group = TOLL_GROUP } = {}) {
  const data = payload?.data ?? payload;
  const totals = data?.totals;
  if (!totals || typeof totals !== 'object') return null;
  const entry = totals[group];
  if (!entry) return null;
  const amount = numberOrNull(entry.singleInr);
  if (amount === null) return null;
  const booths = numberOrNull(data?.boothCount);
  const plazaText =
    booths === null ? '' : ` across ${booths} plaza${booths === 1 ? '' : 's'}`;
  const unpriced = numberOrNull(entry.unknown) || 0;
  const base = `Toll estimate: ₹${amount.toLocaleString('en-IN')}${plazaText}`;
  return unpriced > 0
    ? `${base} (${unpriced} plaza${unpriced === 1 ? '' : 's'} not priced)`
    : base;
}

/** The stops of a tour: where it went from, to, and when. */
export function tourStops(tour) {
  const legs = Array.isArray(tour?.legs) ? tour.legs : [];
  return legs.map((leg) => ({
    from: leg?.from || '—',
    to: leg?.to || '—',
    departedAt: leg?.departedAt || null,
    arrivedAt: leg?.arrivedAt || null,
    km: numberOrNull(leg?.km),
    state: leg?.state || null,
  }));
}

/** Does this tour know about this trip? */
export function tourMentionsTrip(tour, tripId) {
  if (!tour || !tripId) return false;
  const id = String(tripId);
  const legs = Array.isArray(tour.legs) ? tour.legs : [];
  const stops = Array.isArray(tour.passedThrough) ? tour.passedThrough : [];
  return [...legs, ...stops].some(
    (row) => row?.erpTripId && String(row.erpTripId) === id,
  );
}

/** The tour this trip belongs to — the one that names it, else the newest. */
export function pickTourForTrip(payload, tripId) {
  const tours = Array.isArray(payload?.tours) ? payload.tours : [];
  if (!tours.length) return null;
  const match = tours.find((tour) => tourMentionsTrip(tour, tripId));
  return match || tours[0];
}

/** "5:30 PM" in IST; null when the stamp is missing or unusable. */
export function formatStopTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}
