/** Display rules for the Place Hub delivery-route list. Pure: no React, no I/O. */

/** Whole counts in Indian grouping; unknown stays a dash, never 0. */
export const countText = (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

/**
 * How far the typical learned distance sits from the agreed SAP.
 * Only routes with a real verdict get a delta: a missing SAP, no trips or
 * missing distance evidence must not read as "0 km off".
 */
export function sapDelta(route) {
  const sap = route?.sap;
  const c = sap?.comparison;
  if (!sap || !route.n || !c || !c.verdict || ['NO_KM', 'NO_TRIPS'].includes(c.verdict))
    return null;
  if (c.deltaKm == null || !Number.isFinite(Number(c.deltaKm))) return null;
  const delta = Math.round(Number(c.deltaKm));
  const pct = sap.sapKm ? Math.round((delta / Number(sap.sapKm)) * 100) : null;
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '±';
  return {
    tone: c.verdict.toLowerCase(),
    km: `${sign}${Math.abs(delta).toLocaleString('en-IN')} km`,
    pct: pct == null ? null : `${sign}${Math.abs(pct)}%`,
  };
}

/** Relative bar widths (0–100) for learned km vs SAP km in the detail panel. */
export function compareBars(learnedKm, sapKm) {
  const a = Number(learnedKm);
  const b = Number(sapKm);
  const okA = learnedKm != null && Number.isFinite(a) && a > 0;
  const okB = sapKm != null && Number.isFinite(b) && b > 0;
  const max = Math.max(okA ? a : 0, okB ? b : 0);
  if (!max) return null;
  return {
    learned: okA ? Math.round((a / max) * 100) : 0,
    sap: okB ? Math.round((b / max) * 100) : 0,
  };
}

/** One short status tag per route for the list; tone drives colour, title the full wording. */
export function routeTag(route) {
  if (!route?.sap) return { tone: 'muted', text: 'No SAP', title: 'SAP not set' };
  if (!route.n) return { tone: 'muted', text: 'No trips yet', title: 'Waiting for the first trip' };
  const v = route.sap.comparison?.verdict;
  if (!v || v === 'NO_KM')
    return { tone: 'muted', text: 'Needs km', title: 'More distance evidence needed' };
  const d = sapDelta(route);
  if (v === 'OVER') return { tone: 'over', text: `${d?.km || ''} over`.trim(), title: 'Over SAP' };
  if (v === 'UNDER')
    return { tone: 'under', text: `${d?.km || ''} under`.trim(), title: 'Under SAP' };
  return {
    tone: 'within',
    text: 'On SAP',
    title: `Within ${route.sap.tolerancePct ?? 10}% of SAP`,
  };
}
