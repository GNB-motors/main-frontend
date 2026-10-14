import { formatKm, formatNum, timeAgo } from '../../../../utils/formatters';
import { distanceInWindow, daysSince } from '../../vehicle360Logic';
import CardHead from './CardHead';

/**
 * Utilisation from the odometer history — the difference between the first and
 * last CAN reading we hold. Deliberately not an estimate: with fewer than two
 * readings the card says so instead of implying the truck sat still.
 */
export default function UtilisationCard({ history, health, onGoTrips }) {
  const travelled = distanceInWindow(history);
  const silentDays = daysSince(health?.pulledAt);
  const readings = (history || []).length;

  return (
    <section className="v360-card">
      <CardHead
        title="Utilisation"
        action={
          <button type="button" className="v360-link" onClick={onGoTrips}>
            Trip history →
          </button>
        }
      />

      {travelled == null ? (
        <>
          <p className="v360-figure">
            <span className="v360-figure-value">—</span>
            <span className="v360-figure-note">no distance can be derived</span>
          </p>
          <div className="v360-empty">
            <span className="v360-empty-title">
              {readings === 1 ? 'Only one odometer reading' : 'No odometer history'}
            </span>
            <span className="v360-empty-hint">
              Distance travelled is the gap between two CAN readings. With{' '}
              {readings === 1 ? 'a single reading' : 'none'} in the window there is nothing to
              subtract.
            </span>
          </div>
        </>
      ) : (
        <>
          <p className="v360-figure">
            <span className="v360-figure-value">{formatKm(travelled)}</span>
            <span
              className={`v360-figure-note ${travelled === 0 ? 'v360-figure-note--crit' : ''}`.trim()}
            >
              in the telemetry window
            </span>
          </p>
          <p className="v360-card-lede">
            {travelled === 0
              ? `No movement recorded across ${formatNum(readings)} readings. The truck has been earning nothing.`
              : `Derived from ${formatNum(readings)} CAN odometer readings.`}
            {silentDays != null && silentDays >= 1
              ? ` Last reading ${timeAgo(health.pulledAt)}.`
              : ''}
          </p>
        </>
      )}
    </section>
  );
}
