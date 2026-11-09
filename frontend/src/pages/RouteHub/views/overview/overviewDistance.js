import { toMeasured } from '../../../../utils/measured.js';
import { fleetAttribution } from '../../../../utils/measuredAttribution.js';

/**
 * The "Distance covered" figure of the utilization response, and how much of
 * the fleet it covers. The old response has no attribution, so it only ever
 * produces the distance.
 */
export function distanceCoverage(utilization) {
  const fleet = utilization?.fleet ?? null;
  const distanceKm = toMeasured(
    fleet?.totalKm ?? utilization?.totals?.totalKm ?? utilization?.totalKm,
  );
  const attribution = fleetAttribution(fleet, utilization);
  return {
    distanceKm,
    trucks: attribution.trucks,
    note: attribution.note,
    partial: attribution.partial,
  };
}
