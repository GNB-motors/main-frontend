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
  MANUALLY_CLOSED: 'Closed by hand',
  LADEN_STOP_PASSED: 'Stopped at a yard with a load on board',
  CLOSE_HELD_LADEN: 'Waiting for a trip to finish before ending',
  CLOSED_UNRESOLVED_LOAD: 'Ended without knowing where the load came off',
};

/** Why a yard stop was not the end of the cycle, in the drawer's words. */
export const PASS_REASON_LABEL = {
  closed_after_leaving: 'trip closed after it left',
  dropped_after_leaving: 'GPS shows it reached the drop later',
  loaded_after_leaving: 'it was loaded after leaving',
};

/** Where a distance figure came from. Two km numbers are not comparable without it. */
export const SOURCE_LABEL = {
  odometer: 'Odometer',
  road_snapped: 'Road-matched',
  road_matched: 'Road distance (our engine)',
  gps_haversine: 'GPS straight-line',
  none: 'Unavailable',
};

/** Where the cycle's fuel figure came from. */
export const FUEL_SOURCE_LABEL = {
  SINK: 'FleetEdge fuel meter',
  SNAPSHOT: 'Tank-level estimate',
};

/**
 * How far the cycle's telematics can be trusted. HIGH needs both ends proven by a
 * yard geofence and km read off the odometer; anything else is LOW.
 */
export const CONFIDENCE_LABEL = {
  HIGH: { text: 'High confidence', tone: 'ok' },
  LOW: { text: 'Low confidence', tone: 'warn' },
};

/**
 * The cycle's telematics as the drawer shows it, or null when there is no row yet
 * (open cycle, or closed but not rolled up).
 */
export function tourTelematicsView(telematics) {
  if (!telematics) return null;
  const km = telematics.actual?.totalTripKm ?? null;
  const fuelL = telematics.actual?.fuelConsumedL ?? null;
  return {
    measured: telematics.status === 'COMPUTED',
    fuelL,
    fuelSource: FUEL_SOURCE_LABEL[telematics.actual?.fuelSource] || null,
    kmPerL: km != null && fuelL > 0 ? Math.round((km / fuelL) * 100) / 100 : null,
    confidence: CONFIDENCE_LABEL[telematics.confidence] || null,
    anchored: Boolean(telematics.warehouse?.anchored),
    computedAt: telematics.computedAt || null,
  };
}

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
