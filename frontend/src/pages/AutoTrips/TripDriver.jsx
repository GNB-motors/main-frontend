const REASONS = {
  UNASSIGNED: 'No assignment at departure',
  AMBIGUOUS: 'Assignment conflict',
  UNAVAILABLE: 'Driver lookup unavailable',
  DRIVER_NOT_FOUND: 'Driver record unavailable',
  MISSING_VEHICLE: 'Vehicle link missing',
  MISSING_TIME: 'Departure time missing',
};

export default function TripDriver({ trip, onRetry }) {
  const driver = trip.driver;
  const status = trip.driverResolution?.status;
  const label = driver?.name || driver?.mobileNumber;
  if (label) return <span title={driver.mobileNumber || undefined}>{label}</span>;
  return (
    <span className="atx-driver-state">
      {REASONS[status] || (driver ? 'Driver name not recorded' : 'Driver unavailable')}
      {status === 'UNAVAILABLE' && onRetry && (
        <button
          type="button"
          className="atx-link"
          onClick={(event) => {
            event.stopPropagation();
            onRetry();
          }}
        >
          Retry lookup
        </button>
      )}
    </span>
  );
}
