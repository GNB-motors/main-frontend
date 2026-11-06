/** Evidence is descriptive: an algorithmic result is not proof of delivery. */
const REASONS = {
  OVERLAPPING_OBSERVATIONS: 'Overlapping observations at this plant were combined into one visit.',
  SAME_CAMPUS_RETURN: 'The truck returned to the same plant within the supported visit window.',
  STATIONARY_CONTINUATION: 'Movement evidence supports one continuous plant visit across the wait.',
  LONG_QUEUE_CONFIRMED: 'Movement evidence supports one continuous plant visit across the wait.',
  COVERED_STATIONARY_GPS_CAN:
    'GPS coverage and vehicle distance readings support one continuous plant visit across the wait.',
  LONG_GAP: 'The gap between plant visits is too long to establish one continuous visit.',
  MOVED_GAP: 'The truck moved during a telemetry gap. These plant visits were kept separate.',
  UNKNOWN_COVERAGE:
    'Coverage is insufficient to establish whether these plant visits belong together.',
  HUMAN_LOAD: 'A person recorded a new loading event, so it starts a separate pickup.',
  HUMAN_UNLOAD: 'A person recorded unloading at this stop.',
  DIFFERENT_CAMPUS: 'The truck reached a different plant campus.',
  TELEMETRY_GAP_MOVED:
    'The truck moved during a telemetry gap. These plant visits were kept separate.',
  TELEMETRY_GAP_UNKNOWN:
    'A telemetry gap could hide a separate journey, so the visits could not safely be combined.',
  MISSING_INTERVAL: 'The available timestamps are insufficient to establish one continuous visit.',
  LONG_INTERVAL_COVERAGE_UNKNOWN:
    'The gap between plant visits has insufficient movement coverage to establish one continuous visit.',
};

export default function TripEvidence({ trip }) {
  const decision = trip?.boundaryDecision;
  const register = trip?.drop?.source === 'REGISTER';
  if (!decision && !register) return null;
  const explanation =
    decision &&
    (REASONS[decision.reason] ||
      (decision.result === 'UNRESOLVED'
        ? 'The available evidence does not establish whether this was a separate journey.'
        : decision.result === 'CONTINUE_VISIT'
          ? 'Compatible stop observations were grouped into one plant visit.'
          : 'The stop and movement evidence keeps this pickup separate from the previous visit.'));
  return (
    <section className="atx-card" aria-label="Trip evidence">
      <h2 className="atx-card-title">Why this trip is recorded</h2>
      {explanation && <p>{explanation}</p>}
      {register && (
        <p>
          The register route is associated with this movement. It does not provide an observed
          unloading time or proof of delivery.
        </p>
      )}
      {trip?.leg === 'REPOSITION' && (
        <p>This vehicle movement is counted separately from loaded deliveries.</p>
      )}
    </section>
  );
}
