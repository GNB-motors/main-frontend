const REASONS = {
  WAITING_START: 'Queued in ERP — waiting to start',
  WAITING_GPS: 'Waiting for GPS evidence',
  NO_PICKUP_SITE: 'Pickup site missing — link a GPS trip manually',
  PICKUP_SITE_MISSING: 'Pickup site unavailable',
  PICKUP_NOT_TRACKED: 'Pickup not tracked by trip detection',
  PLACEMENT_MISSING: 'ERP placement unavailable',
  VEHICLE_MISSING: 'Vehicle unavailable',
  AMBIGUOUS_MATCH: 'Several possible GPS matches — review required',
  LINK_CONFLICT: 'GPS trip already associated — review required',
  AUTO_MATCH_DISABLED: 'Automatic linking paused after manual removal',
  LINKED_TRIP_UNAVAILABLE: 'Linked GPS trip unavailable — review required',
  ERP_DETAILS_CHANGED: 'ERP vehicle or route changed — review GPS association',
  MATCH_EVIDENCE_CHANGED: 'New GPS evidence conflicts with this association — review required',
  CANCELLED_WITH_GPS: 'ERP cancelled; GPS evidence retained for review',
  ERP_CANCELLED: 'Cancelled in ERP',
};

export function erpPlanTracking(plan) {
  if (plan?.source !== 'ERP') return '';
  return (
    REASONS[plan.trackingReason] ||
    (plan.autoTripId ? 'GPS trip linked' : 'Waiting for GPS evidence')
  );
}
