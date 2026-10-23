import { describe, expect, it } from 'vitest';
import {
  AGREEMENT_TEXT,
  UNKNOWN_REASON_TEXT,
  agreementLine,
  completenessLine,
  extraVsLane,
  inr,
  moneyCell,
  reconciliationCell,
  tabCounts,
} from './tollsView';

/**
 * These tests pin the two rules the toll work is built around:
 *   1. an estimate is not a bill, and says so in the row it renders;
 *   2. unknown is never zero, in any cell.
 */
describe('money cells', () => {
  it('labels an unreconciled estimate as an estimate, in the cell itself', () => {
    const cell = moneyCell({ amountInr: 195, unreconciledEstimate: true });
    expect(cell.tone).toBe('estimate');
    expect(cell.text).toContain('195');
    expect(cell.text).toContain('estimate');
  });

  it('prints a driver bill as money, with no estimate wording', () => {
    const cell = moneyCell({ amountInr: 195, unreconciledEstimate: false });
    expect(cell.tone).toBe('bill');
    expect(cell.text).toBe('₹195');
  });

  it('never prints zero for a pass with no amount', () => {
    const cell = moneyCell({ amountInr: null, unknownReason: 'NO_RATE_ON_FILE' });
    expect(cell.text).toBe('unknown');
    expect(cell.text).not.toContain('0');
    expect(cell.reason).toBe(UNKNOWN_REASON_TEXT.NO_RATE_ON_FILE);
  });

  it('has words for every reason the backend can send', () => {
    for (const key of Object.keys(UNKNOWN_REASON_TEXT)) expect(UNKNOWN_REASON_TEXT[key]).toBeTruthy();
  });

  it('renders a missing amount as a dash, not a zero', () => {
    expect(inr(null)).toBe('—');
    expect(inr(undefined)).toBe('—');
    expect(inr(0)).toBe('₹0');
  });
});

describe('reconciliation keeps the two witnesses apart', () => {
  const row = {
    estimatedInr: 200,
    estimatedPasses: 2,
    paidInr: 390,
    deltaInr: 190,
    reconciled: true,
    unreconciledEstimate: false,
  };

  it('shows estimate, payment and difference as three separate things', () => {
    const c = reconciliationCell(row);
    expect(c.estimate).toBe('₹200');
    expect(c.paid).toBe('₹390');
    expect(c.delta).toBe('₹190');
    expect(c.state).toBe('reconciled');
  });

  it('has no difference when there is no bill to differ from', () => {
    const c = reconciliationCell({ ...row, paidInr: null, deltaInr: null, unreconciledEstimate: true });
    expect(c.paid).toBeNull();
    expect(c.delta).toBeNull();
    expect(c.state).toBe('estimate only — no driver bill yet');
  });
});

describe('the lane normal', () => {
  it('says so when there is no lane to compare against, instead of saying zero', () => {
    const c = extraVsLane({ extraVsLaneInr: null });
    expect(c.tone).toBe('muted');
    expect(c.text).toContain('no lane');
    expect(c.text).not.toContain('₹0');
  });

  it('reads at the normal when the driver is on it', () => {
    expect(extraVsLane({ extraVsLaneInr: 0 }).text).toBe('at the lane normal');
  });

  it('names the direction of the difference', () => {
    expect(extraVsLane({ extraVsLaneInr: 95 }).text).toContain('above');
    expect(extraVsLane({ extraVsLaneInr: -95 }).text).toContain('below');
  });
});

describe('honest counts', () => {
  it('says the totals are lower bounds when a pass is unpriced', () => {
    const line = completenessLine([
      { complete: false, unknownPasses: 3 },
      { complete: true, unknownPasses: 0 },
    ]);
    expect(line).toContain('3 real passes');
    expect(line).toContain('lower bounds');
  });

  it('says nothing is missing when everything is priced', () => {
    expect(completenessLine([{ complete: true, unknownPasses: 0 }])).toContain('known amount');
  });

  it('singularises a single missing pass', () => {
    expect(completenessLine([{ complete: false, unknownPasses: 1 }])).toContain('1 real pass on 1 vehicle');
  });
});

describe('the plaza master states what it knows and what it does not', () => {
  it('describes a confirmed gate with both directions', () => {
    const a = agreementLine({ agreement: 'OSM_AND_FLEET', review: 'CONFIRMED', gateState: 'RESOLVED', gateSides: ['F', 'R'] });
    expect(a.agreement).toBe(AGREEMENT_TEXT.OSM_AND_FLEET);
    expect(a.review).toBe('confirmed');
    expect(a.sides).toBe('F / R');
  });

  it('says an unresolved gate prices nothing', () => {
    const a = agreementLine({ agreement: 'OSM_ONLY', review: 'CANDIDATE', gateState: 'UNRESOLVED', gateSides: [] });
    expect(a.gate).toContain('prices nothing');
    expect(a.sides).toBeNull();
  });

  it('has words for every agreement state the backend can send', () => {
    for (const key of Object.keys(AGREEMENT_TEXT)) expect(AGREEMENT_TEXT[key]).toBeTruthy();
  });
});

describe('tab counts', () => {
  it('counts candidates and unreconciled estimates, not just rows', () => {
    const c = tabCounts({
      plazas: [{ review: 'CONFIRMED' }, { review: 'CANDIDATE' }],
      reconciliation: [{ unreconciledEstimate: true }, { unreconciledEstimate: false }],
      returnGaps: [{ verdict: 'RETURN_RULE_NOT_APPLIED' }, { verdict: 'WITHIN_RETURN_RULE' }],
    });
    expect(c.plazas).toBe(2);
    expect(c.candidates).toBe(1);
    expect(c.unreconciled).toBe(1);
    expect(c.gaps).toBe(1);
  });
});