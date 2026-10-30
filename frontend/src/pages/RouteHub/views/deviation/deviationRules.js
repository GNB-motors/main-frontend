export const STATUS_FILTERS = [
  { key: 'all', label: 'All statuses' },
  { key: 'OPEN', label: 'Please review', ic: 'alert', c: '#C56200' },
  { key: 'REVIEWED', label: 'Reviewed', ic: 'check', c: '#187A32' },
];

/** Which part of the trip the truck was on. NONE = outside any trip. */
export const LEG_FILTERS = [
  { key: 'all', label: 'Any leg' },
  { key: 'LADEN', label: 'Loaded' },
  { key: 'RETURN', label: 'Empty, driving back' },
  { key: 'NONE', label: 'Outside any trip' },
];

export const REVIEW_REASONS = [
  { key: 'ROAD_CLOSED', label: 'Road closed / diversion' },
  { key: 'FUEL', label: 'Went for fuel' },
  { key: 'DELIVERY', label: 'Extra delivery or pickup' },
  { key: 'DRIVER', label: 'Driver took a wrong or own route' },
  { key: 'AUTHORISED', label: 'Authorised by us' },
  { key: 'OTHER', label: 'Other' },
];

export const reasonLabel = (key) => REVIEW_REASONS.find((r) => r.key === key)?.label || null;

/**
 * How a detour's ₹ was worked out: the trip's own cost per km (the number only on the detail, which
 * reads it from the trip), or the standard rate.
 */
export function costBasisLabel(d) {
  if (d.costBasis !== 'TRIP') return 'at the standard rate';
  return d.costPerKmInr != null
    ? `at this trip's ₹${Math.round(d.costPerKmInr)}/km`
    : "at this trip's own cost per km";
}

export const isOpen = (d) => String(d.status || '').toUpperCase() === 'OPEN';

export const normalisePlate = (s) =>
  String(s || '')
    .replace(/[-\s]/g, '')
    .toLowerCase();

export function legLabel(trip) {
  if (!trip) return 'Outside any trip';
  if (trip.leg === 'LADEN') return 'Loaded';
  if (trip.leg === 'RETURN') return 'Empty, driving back';
  return 'On trip';
}

/** "Plant A → Durgapur Site (+1 drop)"; a trip still on the road has no drop yet. */
export function tripLabel(trip) {
  if (!trip) return null;
  const from = trip.pickupName || 'Unnamed pickup';
  const to = trip.dropName || (trip.tripOpen ? 'still on the road' : 'drop not named');
  const extra = trip.extraDropCount
    ? ` (+${trip.extraDropCount} drop${trip.extraDropCount > 1 ? 's' : ''})`
    : '';
  return `${from} → ${to}${extra}`;
}

/** Plate, trip places and the route label all match a search. */
export function matchesSearch(d, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  if (normalisePlate(d.registrationNumber).includes(normalisePlate(q))) return true;
  return [d.corridorLabel, d.trip?.pickupName, d.trip?.dropName]
    .filter(Boolean)
    .some((s) => s.toLowerCase().includes(needle));
}

/**
 * Rows grouped by the trip they happened on, in the order the feed sorted
 * them. A run outside any trip is its own group.
 */
export function groupByTrip(rows) {
  const groups = [];
  const byTrip = new Map();
  for (const d of rows) {
    const id = d.trip?.autoTripId ? String(d.trip.autoTripId) : null;
    let g = id ? byTrip.get(id) : null;
    if (!g) {
      g = {
        key: id || `event:${d._id}`,
        autoTripId: id,
        trip: d.trip || null,
        registrationNumber: d.registrationNumber,
        events: [],
        extraKm: 0,
        costInr: 0,
        open: 0,
      };
      groups.push(g);
      if (id) byTrip.set(id, g);
    }
    g.events.push(d);
    g.extraKm += d.extraKmEstimate || 0;
    g.costInr += d.estimatedExtraCostInr || 0;
    if (isOpen(d)) g.open += 1;
  }
  for (const g of groups) {
    g.events.sort(
      (a, b) => new Date(a.startedAt || a.detectedAt) - new Date(b.startedAt || b.detectedAt),
    );
  }
  return groups;
}

const two = (n) => String(n).padStart(2, '0');
export const clock = (d) => {
  const x = new Date(d);
  return `${two(x.getHours())}:${two(x.getMinutes())}`;
};

/** "14:05–14:43 · 38 min" (the end is omitted for a one-fix run). */
export function runWindow(d) {
  if (!d.startedAt) return null;
  const start = clock(d.startedAt);
  if (!d.endedAt) return start;
  const mins = d.durationMin ?? Math.round((new Date(d.endedAt) - new Date(d.startedAt)) / 60000);
  return `${start}–${clock(d.endedAt)} · ${mins} min`;
}

/** "14 Oct" in the viewer's locale. */
export const shortDay = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

/** Date inputs are local days; the API wants instants covering the whole day. */
export function dayRange(from, to) {
  return {
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
  };
}
