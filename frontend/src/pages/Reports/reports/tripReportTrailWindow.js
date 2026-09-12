/**
 * Pure logic for the trip report route map (rule 21): derive the breadcrumb
 * trail query window from a trip record whose date-field names vary between
 * the TripLedger and flat TripReport shapes.
 */

const FROM_CANDIDATES = [
  'dispatchedAt',
  'tripStartDate',
  'startDate',
  'departedAt',
  'loadingDate',
  'createdAt',
  'date',
];

const TO_CANDIDATES = [
  'tripClosedAt',
  'unloadedAt',
  'podReceivedAt',
  'deliveredAt',
  'tripEndDate',
  'endDate',
];

const START_PAD_MS = 2 * 60 * 60 * 1000;
const SINGLE_POINT_PAD_MS = 12 * 60 * 60 * 1000;

const validTime = (value) => {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
};

const firstValid = (obj, keys) => {
  for (const key of keys) {
    const t = validTime(obj?.[key]);
    if (t !== null) return t;
  }
  return null;
};

/**
 * Trail query window for a trip, or null when the trip carries no usable
 * dates. The window pads dispatch/close by two hours each side; a trip with
 * only one datable bound gets ±12 h around it so a same-day trail still
 * returns points.
 */
export function trailWindowForTrip(trip) {
  if (!trip || typeof trip !== 'object') return null;
  const from = firstValid(trip, FROM_CANDIDATES);
  const to = firstValid(trip, TO_CANDIDATES);

  if (from === null && to === null) return null;
  if (from !== null && to !== null) {
    const lo = Math.min(from, to) - START_PAD_MS;
    const hi = Math.max(from, to) + START_PAD_MS;
    return { fromIso: new Date(lo).toISOString(), toIso: new Date(hi).toISOString() };
  }
  const anchor = (from ?? to) + 0;
  return {
    fromIso: new Date(anchor - SINGLE_POINT_PAD_MS).toISOString(),
    toIso: new Date(anchor + SINGLE_POINT_PAD_MS).toISOString(),
  };
}
