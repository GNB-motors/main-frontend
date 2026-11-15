import { costReason, runningCostParts } from './tripMeasureModel';

/** Known fuel and estimated maintenance costs, with missing costs explained. */
export default function TripCostNote({ trip }) {
  const parts = runningCostParts(trip);
  return (
    <small className="atx-cost-note">
      {parts ? `fuel ${parts.fuel}` : costReason(trip)}
      {parts ? ` · estimated maintenance cost ${parts.wear}` : ''}
    </small>
  );
}
