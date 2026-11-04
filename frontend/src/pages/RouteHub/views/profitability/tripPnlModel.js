/**
 * Trip P&L — the ₹ layer of one trip.
 *
 * Every figure keeps the source the API gave it, and a figure the API could not
 * price is unknown, never zero: a null cost line is shown as "—" with the reason
 * the API gave for it, and the margin is withheld when the cost behind it is
 * only a part of the truth.
 */

export const UNKNOWN = '—';

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

/** ₹ — "—" for anything that is not a known number (0 stays ₹0). */
export const rupees = (n) => (isNum(n) ? `₹${Math.round(n).toLocaleString('en-IN')}` : UNKNOWN);

/** A percentage — "—" for anything that is not a known number. */
export const percent = (n) => (isNum(n) ? `${n.toFixed(1)}%` : UNKNOWN);

/** Cost lines the API could not price — unknown, so the total is not the cost. */
export const unknownCostLines = (pnl) => (pnl?.costs || []).filter((c) => !isNum(c?.amountInr));

/** Where each priced rupee came from — the API's own source labels. */
export const costSources = (pnl) => [
  ...new Set(
    (pnl?.costs || [])
      .filter((c) => isNum(c?.amountInr))
      .map((c) => c.source)
      .filter(Boolean),
  ),
];

/** Why the revenue is missing, when it is. */
export const revenueReason = (pnl) =>
  isNum(pnl?.revenueInr) ? null : pnl?.revenueNote || 'No revenue recorded for this trip.';

/** Why the cost is missing, when a cost line is unknown. */
export const costReason = (pnl) => {
  const unknown = unknownCostLines(pnl);
  if (!unknown.length) return null;
  return unknown
    .map((c) => `${c.type}: ${c.note || 'not priced for this trip'}`)
    .join(' · ');
};

/**
 * The margin the API could state. A trip whose cost is only partly known has no
 * margin to state — the known part would flatter it.
 */
export const marginOf = (pnl) => {
  if (!isNum(pnl?.marginPct)) return null;
  if (unknownCostLines(pnl).length) return null;
  return pnl.marginPct;
};

/** One trip, ready to render: the figures, and the reason each unknown one is unknown. */
export const tripPnlRow = (pnl) => {
  const costIncomplete = unknownCostLines(pnl).length > 0;
  const revenueMissing = !isNum(pnl?.revenueInr);
  const reason = costReason(pnl);
  return {
    id: pnl?.trip?.id || null,
    vehicle: pnl?.trip?.registrationNumber || '—',
    at: pnl?.trip?.window?.to || null,
    km: isNum(pnl?.distanceKm) ? pnl.distanceKm : null,
    revenue: isNum(pnl?.revenueInr) ? pnl.revenueInr : null,
    revenueReason: revenueReason(pnl),
    cost: !costIncomplete && isNum(pnl?.totalCostInr) ? pnl.totalCostInr : null,
    knownCost: isNum(pnl?.totalCostInr) ? pnl.totalCostInr : null,
    costReason: reason,
    sources: costSources(pnl),
    margin: marginOf(pnl),
    marginReason: reason || (revenueMissing ? revenueReason(pnl) : null),
  };
};

/** Worst margin first. A trip with no margin sorts last — unknown is not zero. */
export const byMarginAsc = (a, b) => {
  const av = a?.margin ?? null;
  const bv = b?.margin ?? null;
  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;
  return av - bv;
};

/** The rows in the order the table shows them: worst margin first. */
export const sortByMarginAsc = (rows) => [...(rows || [])].sort(byMarginAsc);
