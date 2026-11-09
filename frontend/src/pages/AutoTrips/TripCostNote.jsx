import { PARTIAL_LABEL } from '../../utils/measured';
import { costReason, runningCostParts } from './tripMeasureModel';

/**
 * The note under the running cost: what the legs cost, and the badge that says the fuel
 * was only partly measured.
 */
export default function TripCostNote({ trip }) {
  const parts = runningCostParts(trip);
  return (
    <small>
      {parts ? `fuel ${parts.fuel}` : costReason(trip)}
      {parts && trip?.fuelPartial ? (
        <span className="atx-chip atx-chip--watch">{PARTIAL_LABEL}</span>
      ) : null}
      {parts ? ` · wear ${parts.wear}` : ''}
    </small>
  );
}
