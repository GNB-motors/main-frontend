import { formatInIST } from '../../utils/dateUtils';

/** Shared pump rows and totals for the Fuel Integrity card and watchlist. */

export const MAX_PUMP_ROWS = 5;

export function pumpSourceSummary(p) {
  const counts = p.sourceCounts || {};
  return [
    counts.register ? `${counts.register} register entries` : null,
    counts.sensor ? `${counts.sensor} sensor fills` : null,
    counts.alert ? `${counts.alert} refuel alerts` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Billed litres, measured litres and the money — either name the API used. */
export function pumpRow(p) {
  return {
    name: p?.pumpName || p?.stationName || 'Pump',
    fills: p?.totalFills ?? p?.fillCount ?? null,
    billedL: p?.totalBilledL ?? p?.totalBilledLitres ?? null,
    measuredL: p?.totalMeasuredL ?? p?.totalMeasuredLitres ?? null,
    shortfallL: p?.shortfallL ?? p?.totalShortageLitres ?? null,
    variancePct: p?.shortfallPct ?? p?.variancePercent ?? null,
    rupeeLoss: p?.rupeeImpact ?? p?.totalRupeeLoss ?? null,
    sourceCounts: p?.sourceCounts,
    registeredLitres: p?.registeredLitres,
    status: p?.honestyStatus || p?.status || null,
  };
}

/** Biggest shortfall first — the pumps an owner argues about first. */
export function sortPumps(pumps) {
  return [...(pumps || [])].sort((a, b) => {
    const av = a?.shortfallL == null ? Number.NEGATIVE_INFINITY : a.shortfallL;
    const bv = b?.shortfallL == null ? Number.NEGATIVE_INFINITY : b.shortfallL;
    if (av !== bv) return bv - av;
    return String(a?.name || a?.pumpName || '').localeCompare(String(b?.name || b?.pumpName || ''));
  });
}

/** Keep the existing watchlist bands identical on both pump surfaces. */
function derivePumpStatus(shortfallPct, fills) {
  if (fills < 3 || shortfallPct == null) return 'INSUFFICIENT_DATA';
  if (shortfallPct <= 1) return 'HONEST';
  if (shortfallPct <= 3) return 'RELIABLE';
  if (shortfallPct <= 6) return 'SUSPICIOUS';
  if (shortfallPct <= 10) return 'UNRELIABLE';
  return 'CHRONIC_SHORTAGE';
}

export function normalisePumpLedger(ledger) {
  const pumps = (ledger?.pumps || []).map((p) => ({
    pumpName: p.pump,
    fillCount: p.fills,
    totalBilledLitres: p.claimedLitres,
    totalMeasuredLitres: p.actualLitres,
    totalShortageLitres: p.shortfallLitres,
    totalRupeeLoss: p.estimatedLossInr,
    shortfallPct: p.shortfallPct,
    status:
      p.auditStatus === 'NOT_AUDITED' || !(p.fills > 0)
        ? 'NOT_AUDITED'
        : derivePumpStatus(p.shortfallPct, p.fills),
    sourceCounts: p.sourceCounts,
    registeredLitres: p.registeredLitres,
    lat: p.lat,
    lng: p.lng,
    lastFillAt: p.lastFillAt,
    _id: p.pump,
  }));
  const audited = pumps.filter((p) => p.status !== 'NOT_AUDITED');
  return {
    window: ledger?.window,
    windowLabel:
      ledger?.window?.from && ledger?.window?.to
        ? `${formatInIST(ledger.window.from, 'D MMM YYYY')} – ${formatInIST(ledger.window.to, 'D MMM YYYY')} IST`
        : null,
    pumps,
    summary: {
      totalKnownPumps: pumps.length,
      totalPumpsEvaluated: audited.length,
      totalAuditedFills: pumps.reduce((sum, p) => sum + (p.fillCount || 0), 0),
      totalShortLitres: audited.length
        ? audited.reduce((sum, p) => sum + (p.totalShortageLitres || 0), 0)
        : null,
      totalRupeeLoss: audited.length
        ? audited.reduce((sum, p) => sum + (p.totalRupeeLoss || 0), 0)
        : null,
      chronicPumpsCount: pumps.filter((p) => p.status === 'CHRONIC_SHORTAGE').length,
    },
  };
}
