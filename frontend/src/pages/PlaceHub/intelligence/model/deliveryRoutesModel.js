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

/**
 * Summary chips above the list. Chips with a `filter` act as the SAP status
 * filter, so the count and the list behind it are always the same thing.
 */
export function summaryChips(totals, showSap) {
  if (!totals) return [];
  const chips = [
    { key: 'routes', value: countText(totals.routes), label: 'routes' },
    { key: 'trips', value: countText(totals.trips), label: 'trips' },
  ];
  if (showSap)
    chips.push(
      {
        key: 'over',
        value: countText(totals.over),
        label: 'over SAP',
        filter: 'OVER',
        tone: 'over',
      },
      {
        key: 'nosap',
        value: countText(totals.withoutSap),
        label: 'SAP not set',
        filter: 'NO_SAP',
        tone: 'muted',
      },
    );
  return chips;
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
