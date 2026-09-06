/** Pure display logic for the Vehicle 360 profile (rule 21). */

export function riskLamp(risk) {
  if (risk === 'OVERDUE') return 'lamp--critical';
  if (risk === 'DUE_SOON') return 'lamp--caution';
  return 'lamp--ok';
}

/**
 * A DEF ledger balance object is all-zero from the backend when nothing has
 * ever been recorded. Treat that as no data rather than a confident "0 L".
 */
export function hasDefLedgerData(balance) {
  if (!balance) return false;
  const hasValue = [balance.claimedAdblueL, balance.telemetryDefL, balance.expectedBalanceL].some(
    (v) => v != null && Number(v) !== 0,
  );
  const hasFlags = (balance.flagCount ?? 0) > 0 || (balance.flags?.length ?? 0) > 0;
  return hasValue || hasFlags;
}

export function fuelUnit(health) {
  return health?.fuelLevelUnit === 'litres' ? 'litres' : 'unverified';
}

export function defUnit(health) {
  return health?.defLevelUnit === 'litres' ? 'litres' : 'unverified';
}
