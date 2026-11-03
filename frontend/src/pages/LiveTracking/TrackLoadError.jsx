/**
 * TrackLoadError — the fleet could not be loaded.
 *
 * Without this, a failed load looked like an empty fleet: "0 vehicles", "No
 * vehicles found", "Waiting for data". That reads as a fact about the fleet
 * when it is a fact about the network, so the failure says so and offers the
 * one action that can fix it — a retry.
 *
 * Unknown is never zero: nothing here says "0 vehicles".
 */
export default function TrackLoadError({ onRetry, className = '' }) {
  return (
    <div className={`track-load-error ${className}`.trim()} role="alert">
      <span className="track-load-error__text">Couldn&apos;t load your fleet</span>
      {onRetry ? (
        <button type="button" className="btn btn--sm" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
