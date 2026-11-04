/**
 * Kaaran pump honesty — the ledger row, read off either field name the pump
 * call used. Pure helpers so the card and its tests share one truth.
 */

export const MAX_PUMP_ROWS = 5;

/** Billed litres, measured litres and the money — either name the API used. */
export function pumpRow(p) {
  return {
    name: p?.pumpName || p?.stationName || 'Pump',
    fills: p?.totalFills ?? p?.fillCount ?? null,
    billedL: p?.totalBilledL ?? p?.totalBilledLitres ?? null,
    measuredL: p?.totalMeasuredL ?? p?.totalMeasuredLitres ?? null,
    shortfallL: p?.shortfallL ?? p?.totalShortageLitres ?? null,
    variancePct: p?.variancePercent ?? null,
    rupeeLoss: p?.rupeeImpact ?? p?.totalRupeeLoss ?? null,
    status: p?.honestyStatus || p?.status || null,
  };
}

/** Biggest shortfall first — the pumps an owner argues about first. */
export function sortPumps(pumps) {
  return [...(pumps || [])].sort((a, b) => {
    const av = a?.shortfallL == null ? Number.NEGATIVE_INFINITY : a.shortfallL;
    const bv = b?.shortfallL == null ? Number.NEGATIVE_INFINITY : b.shortfallL;
    if (av !== bv) return bv - av;
    return String(a?.pumpName || '').localeCompare(String(b?.pumpName || ''));
  });
}
