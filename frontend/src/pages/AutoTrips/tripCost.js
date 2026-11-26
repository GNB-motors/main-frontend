import { formatINR } from '../../utils/formatters';
import { isMeasured } from '../../utils/measured';
import { runningCostAmount, runningCostParts } from './tripMeasureModel';
import { tollSummary } from './tripTolls';

/**
 * The roles the backend lets see toll fares — the same rule it uses for SAP
 * (the server sends the crossings without rupees to anyone else).
 */
export const FARE_ROLES = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];
export const canSeeFares = (role) => FARE_ROLES.includes(role);

/**
 * What this trip cost: the running cost (fuel and wear) and the tolls the truck
 * crossed.
 *
 * A part nobody measured stays unknown — a dash, never a rupee of zero — and the
 * total is only a total when both parts are known.
 */
export function tripCostView(trip, tolls, role) {
  const running = runningCostAmount(trip);
  const parts = runningCostParts(trip);
  const fares = canSeeFares(role);
  const tollInr = fares && isMeasured(tolls?.total?.inr) ? Number(tolls.total.inr) : null;

  const runningText = running.inr != null ? formatINR(running.inr) : '—';
  const runningNote = parts ? `fuel ${parts.fuel} · estimated maintenance cost ${parts.wear}` : null;
  const tollText = tollInr != null ? formatINR(tollInr) : '—';
  const tollNote = fares ? tollSummary(tolls) : null;

  let totalText = '—';
  let totalNote = null;
  if (!fares) {
    // This role may not see the tolls: the running cost is the whole of it.
    totalText = runningText;
  } else if (running.inr != null && tollInr != null) {
    totalText = `${formatINR(running.inr)} + ${formatINR(tollInr)} = ${formatINR(running.inr + tollInr)}`;
  } else if (running.inr != null || tollInr != null) {
    totalNote = `Partial: ${formatINR(running.inr ?? tollInr)} known`;
  }

  return { fares, runningText, runningNote, tollText, tollNote, totalText, totalNote };
}
