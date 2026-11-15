/**
 * What a trip measured, and what it did not — pure.
 *
 * A leg the server could not cost is unknown, never zero: a dash and a count of what is
 * missing say more than a rupee that was never measured.
 */
import { isMeasured, sumKnown } from '../../utils/measured';
import { formatINR } from '../../utils/formatters';

/** The legs of a trip, as the server sent them. */
const legsOf = (trip) => Object.values(trip?.roleEconomics || {}).filter((leg) => leg != null);

/** The loaded run's km: the odometer when the truck has one, else the GPS path. */
export function runKmOf(trip) {
  const km = trip?.km?.ladenOdo ?? trip?.km?.laden ?? null;
  return isMeasured(km) ? Number(km) : null;
}

/** What the trip measured only in part. */
export function partialFlags(trip) {
  return { km: trip?.kmPartial === true, fuel: trip?.fuelPartial === true };
}

/**
 * How the fuel was measured: UNKNOWN when a leg's litres were not measured, PARTIAL when
 * they were partly measured. Null when the server did not say (the old backend).
 */
export function fuelBasis(trip) {
  const bases = legsOf(trip)
    .map((leg) => leg?.fuelBasis)
    .filter(Boolean);
  if (bases.includes('UNKNOWN')) return 'UNKNOWN';
  if (bases.includes('PARTIAL')) return 'PARTIAL';
  if (bases.includes('AVAILABLE')) return 'AVAILABLE';
  return null;
}

/** The trip's legs costed: what was measured, and what the server left out. */
export function legCosts(trip) {
  const legs = legsOf(trip);
  return {
    legs: legs.length,
    fuel: sumKnown(legs.map((leg) => leg?.fuelInr)),
    wear: sumKnown(legs.map((leg) => leg?.wearInr)),
  };
}

/** Prefer the full estimate; otherwise show only known fuel and wear as a subtotal. */
export function runningCostAmount(trip) {
  if (isMeasured(trip?.totalCostInr)) {
    return { inr: Number(trip.totalCostInr), partial: false };
  }
  const { fuel, wear } = legCosts(trip);
  const { sum } = sumKnown([fuel.sum, wear.sum]);
  return { inr: sum, partial: sum != null };
}

/** "₹3,425", or "₹3,358 · 1 of 3 legs costed" when the server left legs out. */
function amountText(amount, note) {
  if (amount.sum == null) return note || 'not measured';
  const parts = [formatINR(amount.sum)];
  if (amount.unknown > 0) parts.push(`${amount.known} of ${amount.total} legs costed`);
  if (note === 'partial') parts.push('partial');
  return parts.join(' · ');
}

/**
 * The note under the running cost: what the legs cost, and how many of them the server
 * could not cost. Null when the trip has not been costed at all yet.
 */
export function runningCostParts(trip) {
  const { legs, fuel, wear } = legCosts(trip);
  if (!legs) return null;
  const note = { UNKNOWN: 'not measured', PARTIAL: 'partial' }[fuelBasis(trip)] || null;
  return { fuel: amountText(fuel, note), wear: amountText(wear, null) };
}

/**
 * Why a trip shows no cost breakdown. A total without legs is an estimate; a
 * missing total uses the server's own reason first, and only a running trip is
 * told the cost is still pending (a finished trip is never told to wait).
 */
export function costReason(trip) {
  if (Number.isFinite(trip?.totalCostInr)) return 'Estimated running cost; breakdown unavailable.';
  if (trip?.economicsAvailability?.reason) return trip.economicsAvailability.reason;
  if (trip?.status === 'OPEN') return 'Cost calculation pending while the trip is running.';
  if (['COMPLETE', 'CONFIRMED'].includes(trip?.status)) {
    return 'Cost calculation unavailable for this completed trip.';
  }
  return 'Cost calculation unavailable until the drop is resolved.';
}
