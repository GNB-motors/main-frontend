/**
 * Display rules for the trips inside a fuel cycle (Fuel Cycles drop-down).
 *
 * "Not in trips" is the cycle km outside every trip's laden run. Empty running
 * (to the plant, back from the drop) lives there, so a large value is normal
 * and is never alarmed on its own. Two cases are worth a look:
 *  - a cycle that ran real km with no trip at all, and
 *  - trips longer than the cycle, which means a slip odometer is wrong.
 */

const NO_TRIP_MIN_KM = 50;

/** null | { tone: 'red'|'amber', label } for the cycle's "Not in trips" cell. */
export function notInTripsAlert(summary) {
  if (!summary || summary.cycleKm == null) return null;
  if (!summary.count && summary.cycleKm > NO_TRIP_MIN_KM) {
    return { tone: 'red', label: 'No trip in this cycle' };
  }
  const tolerance = Math.max(5, 0.02 * summary.cycleKm);
  if (summary.otherKm != null && summary.otherKm < -tolerance) {
    return { tone: 'amber', label: 'Trips run longer than the slips’ odometer — check the slips' };
  }
  return null;
}

/** "Plant → Depot", "+1 drop" when the trip had more. */
export function tripRoute(trip) {
  const from = trip.pickupName || 'Unknown pickup';
  const to = trip.dropName || 'Unknown drop';
  const more = (trip.drops || 1) - 1;
  return `${from} → ${to}${more > 0 ? ` (+${more} drop${more > 1 ? 's' : ''})` : ''}`;
}

export const TRIP_SOURCE_LABEL = { AUTO: 'GPS trip', ERP: 'ERP only' };

const FLAG_LABEL = {
  ODO_DISAGREES: 'Slip odometer disagrees with the trip — split by time',
  PLANNED_KM: 'Planned km from the ERP trip, not measured — not added to totals',
};

/** Plain-language notes for a trip row (partial split first). */
export function tripNotes(trip) {
  const notes = [];
  if (trip.partial && trip.share != null) {
    notes.push(`${Math.round(trip.share * 100)}% in this cycle (crosses a fill)`);
  }
  for (const f of trip.flags || []) notes.push(FLAG_LABEL[f] || f.replace(/_/g, ' ').toLowerCase());
  return notes;
}

/** "4 trips" / "1 trip" / "—" for the cycle row's drop-down toggle. */
export function tripCountLabel(summary) {
  if (!summary) return '—';
  return `${summary.count} trip${summary.count === 1 ? '' : 's'}`;
}
