/**
 * Refuel advisory — the order an owner works in and the reason a number is
 * missing. Pure helpers so the card and its tests share one truth.
 */

export const MAX_ADVISORY_ROWS = 5;

const STATUS_RANK = { CRITICAL: 0, REFUEL_SOON: 1, OK: 2 };

/** Critical first, then the emptiest tank; vehicles we know least about last. */
export function sortAdvisories(advisories) {
  return [...(advisories || [])].sort((a, b) => {
    const rank = (STATUS_RANK[a?.status] ?? 3) - (STATUS_RANK[b?.status] ?? 3);
    if (rank !== 0) return rank;
    const ap = a?.pctFull == null ? Number.POSITIVE_INFINITY : a.pctFull;
    const bp = b?.pctFull == null ? Number.POSITIVE_INFINITY : b.pctFull;
    if (ap !== bp) return ap - bp;
    return String(a?.registrationNumber || '').localeCompare(String(b?.registrationNumber || ''));
  });
}

/** Why a number is missing — the house rule: never a bare dash. */
export function missingReasons(a) {
  const reasons = [];
  if (a?.pctFull == null || a?.currentFuelL == null) reasons.push('no tank reading yet');
  if (a?.avgEfficiencyKmpl == null) reasons.push('no efficiency history yet');
  else if (a?.estimatedRangeKm == null) reasons.push('range not estimated');
  if (a?.tankCapacityL == null || a?.litresToFull == null) reasons.push('tank capacity unknown');
  return reasons;
}
