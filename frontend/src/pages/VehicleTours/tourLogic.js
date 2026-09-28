/**
 * Pure helpers for the Vehicle Tours page.
 */

/**
 * How a cycle ended, as the UI should say it.
 *
 * None of these block anything — a cycle that ended somewhere unexpected is a real
 * operational event to show, not an error to suppress.
 */
export const CLOSE_KIND_LABEL = {
  HOME: { text: 'Back at home yard', tone: 'ok' },
  DIFFERENT_WAREHOUSE: { text: 'Ended at a different warehouse', tone: 'warn' },
  SHIFTED: { text: 'Vehicle shifted to this warehouse', tone: 'info' },
  UNKNOWN: { text: 'Ended away from any warehouse', tone: 'warn' },
};

export const FLAG_LABEL = {
  NO_HOME_WAREHOUSE: 'No home yard set for this vehicle',
  SIDE_TRIP_GAP: 'Some distance belongs to no trip',
  NO_SIDE_TRIPS: 'No ERP trips recorded in this cycle',
};

/** Where a distance figure came from. Two km numbers are not comparable without it. */
export const SOURCE_LABEL = {
  odometer: 'Odometer',
  road_snapped: 'Road-matched',
  gps_haversine: 'GPS straight-line',
  none: 'Unavailable',
};

/** Hours between two instants, or null while a cycle is still running. */
export function durationHours(startedAt, endedAt) {
  if (!startedAt || !endedAt) return null;
  return (new Date(endedAt) - new Date(startedAt)) / 3600000;
}

export function formatDuration(hours) {
  if (hours == null) return '—';
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const d = Math.floor(hours / 24);
  return `${d}d ${Math.round(hours - d * 24)}h`;
}

/**
 * Whether a cycle's own distance and its side trips reconcile.
 *
 * Empty running is billed inside its covering trip, so the two should agree. A real
 * gap means some stretch was never attributed — worth surfacing, not a metric.
 */
export function reconciliation(tour) {
  if (tour?.distanceKm == null || tour?.sideTripDistanceKm == null) return null;
  const gap = tour.unattributedKm ?? tour.distanceKm - tour.sideTripDistanceKm;
  return { gap, isClean: Math.abs(gap) <= 5 };
}

/** Client-side filter so typing narrows the list without a round trip. */
export function filterTours(tours, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return tours;
  return tours.filter((t) =>
    [t.registrationNumber, t.closeKind, t.status]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q)),
  );
}
