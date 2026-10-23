/**
 * Tolls presentation logic — pure, and where the tests belong.
 *
 * Two rules from the toll work are expressed here rather than in the components,
 * because they are the parts that must not drift:
 *
 *  1. An estimate is not a bill. A row that is still our estimate says so IN the
 *     row it renders — not in a tooltip, not in a column header nobody reads.
 *  2. Unknown is not zero. An unpriced pass renders as "unknown", never as ₹0
 *     and never as a blank that reads as nothing owed.
 */

export const UNKNOWN_REASON_TEXT = {
  NO_RATE_ON_FILE: 'no rate on file for this class',
  NO_TOLL_CLASS_ON_VEHICLE: 'vehicle master names no toll class',
  ROAD_NOT_MATCHED: 'a stretch of road could not be matched to any plaza',
};

export const AGREEMENT_TEXT = {
  OSM_AND_FLEET: 'OSM and this fleet agree',
  OSM_ONLY: 'OSM only — this fleet has not been seen there',
  FLEET_ONLY: 'this fleet only — OSM has no booth mapped',
  NEITHER: 'no evidence yet',
};

export const GATE_STATE_TEXT = {
  PENDING: 'gate not resolved yet',
  RESOLVED: 'gate resolved on the road network',
  UNRESOLVED: 'gate could not be resolved — this plaza prices nothing',
  SUPERSEDED: 'the OSM booth is gone; the gate is kept',
};

export function inr(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** What a single money cell should say, in words the owner can act on. */
export function moneyCell(row) {
  if (!row) return { text: '—', tone: 'muted' };
  if (!Number.isFinite(row.amountInr)) {
    return {
      text: 'unknown',
      tone: 'unknown',
      reason: row.unknownReason ? UNKNOWN_REASON_TEXT[row.unknownReason] || row.unknownReason : null,
    };
  }
  if (row.unreconciledEstimate) {
    // The estimate is real evidence, but no human has confirmed it as money.
    return { text: `${inr(row.amountInr)} (estimate)`, tone: 'estimate' };
  }
  return { text: inr(row.amountInr), tone: 'bill' };
}

/** One reconciliation row: estimate, payment, and the difference, never blended. */
export function reconciliationCell(row) {
  return {
    estimate: inr(row.estimatedInr),
    paid: row.paidInr == null ? null : inr(row.paidInr),
    // The difference IS the finding. null when there is nothing to compare yet.
    delta: row.deltaInr == null ? null : inr(Math.abs(row.deltaInr)),
    deltaInr: row.deltaInr,
    state: row.unreconciledEstimate
      ? 'estimate only — no driver bill yet'
      : row.reconciled
        ? 'reconciled'
        : 'billed',
  };
}

/** The one-line footer a report needs: is this total the cost, or a lower bound? */
export function completenessLine(vehicles) {
  const incomplete = (vehicles || []).filter((v) => !v.complete);
  if (!incomplete.length) return 'Every toll on these vehicles has a known amount.';
  const passes = incomplete.reduce((s, v) => s + (v.unknownPasses || 0), 0);
  return `${passes} real pass${passes === 1 ? '' : 'es'} on ${incomplete.length} vehicle${
    incomplete.length === 1 ? '' : 's'
  } have no amount on file — these totals are lower bounds, not the cost.`;
}

/** A driver's extra against the lane's normal, or an honest "no normal to compare". */
export function extraVsLane(row) {
  if (row.extraVsLaneInr == null) return { text: 'no lane with a normal to compare', tone: 'muted' };
  if (Math.abs(row.extraVsLaneInr) < 1) return { text: 'at the lane normal', tone: 'ok' };
  return {
    text: `${inr(Math.abs(row.extraVsLaneInr))} ${row.extraVsLaneInr > 0 ? 'above' : 'below'} the lane normal`,
    tone: row.extraVsLaneInr > 0 ? 'warn' : 'ok',
  };
}

/** Where a plaza sits in the two-witness agreement, in one phrase. */
export function agreementLine(plaza) {
  return {
    agreement: AGREEMENT_TEXT[plaza.agreement] || plaza.agreement,
    review: plaza.review === 'CONFIRMED' ? 'confirmed' : plaza.review === 'REJECTED' ? 'rejected' : 'candidate',
    gate: GATE_STATE_TEXT[plaza.gateState] || plaza.gateState,
    sides: (plaza.gateSides || []).join(' / ') || null,
  };
}

/** Tab counts for the page header. */
export function tabCounts({ plazas = [], reconciliation = [], returnGaps = [] }) {
  return {
    plazas: plazas.length,
    candidates: plazas.filter((p) => p.review !== 'CONFIRMED').length,
    reconciliation: reconciliation.length,
    unreconciled: reconciliation.filter((r) => r.unreconciledEstimate).length,
    gaps: returnGaps.filter((g) => g.verdict === 'RETURN_RULE_NOT_APPLIED').length,
  };
}