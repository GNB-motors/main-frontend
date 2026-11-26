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
 * total is only a total when both parts are known. A running cost the server
 * could only partly cost is a subtotal, not the whole running cost: it never
 * becomes a total, and the tolls are never added to it as one.
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

  // Only a whole running cost can be a total. A subtotal of one is known money,
  // but it is not the whole of what the trip cost.
  const runningWhole = running.inr != null && !running.partial;
  let totalText = '—';
  let totalNote = null;
  if (!fares) {
    // This role may not see the tolls: the running cost is the whole of it.
    if (runningWhole) {
      totalText = runningText;
    } else if (running.inr != null) {
      totalNote = `Partial: ${formatINR(running.inr)} known`;
    }
  } else if (runningWhole && tollInr != null) {
    totalText = `${formatINR(running.inr)} + ${formatINR(tollInr)} = ${formatINR(running.inr + tollInr)}`;
  } else if (running.inr != null || tollInr != null) {
    // Part of it is known. Say how much, and never call it the total.
    totalNote = `Partial: ${formatINR((running.inr ?? 0) + (tollInr ?? 0))} known`;
  }

  return { fares, runningText, runningNote, tollText, tollNote, totalText, totalNote };
}
