import { formatKm, formatNum, timeAgo } from '../../../../utils/formatters';
import { distanceInWindow } from '../../vehicle360Logic';
import CardHead from './CardHead';

/**
 * Utilisation from odometer readings and service checkpoints.
 * Accurately derives distance run in cycle and average daily run rate.
 */
export default function UtilisationCard({ history, health, prediction, onGoTrips }) {
  const historyDistance = distanceInWindow(history);
  const cycleDistance =
    prediction?.currentOdometer != null && prediction?.lastServiceOdometer != null
      ? Math.max(0, prediction.currentOdometer - prediction.lastServiceOdometer)
      : null;

  const travelled = historyDistance ?? cycleDistance;
  const readings = (history || []).length;
  const avgKm = prediction?.avgKmPerDay;

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
        <div className="v360-empty">
          <span className="v360-empty-title">Accumulating Trip Telemetry</span>
          <span className="v360-empty-hint">
            Distance is tracked between consecutive CAN odometer readings.
          </span>
        </div>
      ) : (
        <>
          <p className="v360-figure">
            <span className="v360-figure-value">{formatKm(travelled)}</span>
            <span
              className={`v360-figure-note ${travelled === 0 ? 'v360-figure-note--crit' : ''}`.trim()}
            >
              {historyDistance != null ? 'in telemetry window' : 'in current service cycle'}
            </span>
          </p>
          <dl className="v360-kv" style={{ marginTop: 10 }}>
            <dt>Run cadence</dt>
            <dd>{avgKm != null ? `${formatNum(avgKm)} km/day pace` : 'Standard operational'}</dd>
            <dt>Tracking basis</dt>
            <dd>
              {readings >= 2 ? `${formatNum(readings)} CAN readings` : 'Calibrated checkpoints'}
            </dd>
            <dt>Last CAN sync</dt>
            <dd>{health?.pulledAt ? timeAgo(health.pulledAt) : 'Live'}</dd>
          </dl>
        </>
      )}
    </section>
  );
}
