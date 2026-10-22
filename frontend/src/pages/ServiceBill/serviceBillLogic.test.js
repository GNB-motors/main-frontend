import { describe, it, expect } from 'vitest';
import {
  PROVENANCE,
  formatMoney,
  formatFigure,
  provenanceText,
  deltaText,
  lagText,
  STATE_STYLE,
  filterItems,
  readingText,
} from './serviceBillLogic';

describe('an absent number is never a zero', () => {
  it('formats a real amount in rupees', () => {
    expect(formatMoney(45000)).toBe('₹45,000');
  });

  it('refuses to turn null, undefined or NaN into ₹0', () => {
    [null, undefined, NaN, 'abc', ''].forEach((v) => {
      expect(formatMoney(v)).toBe('Not recorded');
    });
  });

  it('treats a stored 0 as no figure, not as a free service', () => {
    // A ₹0 on a service record is indistinguishable from "nobody wrote one down".
    expect(formatMoney(0)).toBe('Not recorded');
  });

  it('renders a missing bill as its reason, never as an amount', () => {
    expect(formatFigure({ amount: null, kind: PROVENANCE.UNKNOWN, missing: 'NO_BILL' })).toBe(
      'No bill yet',
    );
    expect(formatFigure({ amount: null, missing: 'NO_AMOUNT_RECORDED' })).toBe(
      'No amount on the service record',
    );
    expect(formatFigure(null)).toBe('Not known');
  });

  it('never renders a figure whose amount is missing, even claiming a kind', () => {
    const lying = { amount: null, kind: PROVENANCE.ENTERED, missing: 'NO_RECORD_LOGGED' };
    expect(formatFigure(lying)).toBe('No service record logged');
  });

  it('keeps a prefix outside the money', () => {
    expect(formatFigure({ amount: 900, kind: 'ENTERED' }, { prefix: 'Bill: ' })).toBe('Bill: ₹900');
  });
});

describe('provenance travels with the figure', () => {
  it('names an entered figure', () => {
    expect(provenanceText({ amount: 900, kind: PROVENANCE.ENTERED })).toBe('Entered');
  });

  it('names the field and the confidence of an extracted figure', () => {
    const text = provenanceText({
      amount: 12400,
      kind: PROVENANCE.EXTRACTED,
      ocrField: 'total',
      ocrConfidence: 82.4,
    });
    expect(text).toContain('Extracted');
    expect(text).toContain('total');
    expect(text).toContain('82%');
  });

  it('says estimated is an estimate', () => {
    expect(provenanceText({ amount: 3000, kind: PROVENANCE.ESTIMATED })).toBe(
      'Estimated from your history',
    );
  });

  it('says unknown when there is no figure', () => {
    expect(provenanceText({ amount: null, kind: PROVENANCE.ENTERED })).toBe('Not known');
    expect(provenanceText(undefined)).toBe('Not known');
  });
});

describe('a disagreement is shown, not resolved away', () => {
  it('names which side is bigger and by how much', () => {
    expect(deltaText({ delta: -2000 })).toBe('Service record is ₹2,000 more');
    expect(deltaText({ delta: 1500 })).toBe('Bill is ₹1,500 more');
    expect(deltaText({ delta: 0 })).toBe('Same amount on both sides');
  });

  it('has nothing to say when only one side has a figure', () => {
    expect(deltaText({ delta: null })).toBeNull();
    expect(deltaText(null)).toBeNull();
  });
});

describe('nothing is ever called late', () => {
  it('compares the open item to what this org normally takes', () => {
    expect(lagText({ daysOpen: 40, verdict: 'LONGER_THAN_TYPICAL', orgMedianDays: 6 })).toBe(
      'Open 40 days · longer than your usual 6 days',
    );
    expect(lagText({ daysOpen: 3, verdict: 'TYPICAL', orgMedianDays: 6 })).toBe(
      'Open 3 days · within your usual 6 days',
    );
  });

  it('admits when there is no baseline instead of inventing one', () => {
    expect(lagText({ daysOpen: 120, verdict: 'NO_BASELINE', orgMedianDays: null })).toBe(
      'Open 120 days · no baseline for your org yet',
    );
  });

  it('reports a received bill as how long it took', () => {
    expect(lagText({ daysOpen: 4, verdict: 'BILL_RECEIVED' })).toBe('Billed after 4 days');
  });

  it('never uses the word overdue or late', () => {
    const text = [
      lagText({ daysOpen: 90, verdict: 'LONGER_THAN_TYPICAL', orgMedianDays: 3 }),
      lagText({ daysOpen: 90, verdict: 'NO_BASELINE' }),
    ].join(' ');
    expect(text).not.toMatch(/overdue|late/i);
  });
});

describe('the list filters to what a manager is chasing', () => {
  const rows = [
    { id: 'a', open: true, state: 'NO_BILL', comparison: { verdict: 'AGREES' } },
    { id: 'b', open: true, state: 'NO_BILL', comparison: { verdict: 'DISAGREES' } },
    { id: 'c', open: false, state: 'IN_LEDGER', comparison: { verdict: 'AGREES' } },
    { id: 'd', open: false, state: 'TURNED_DOWN', comparison: null },
  ];

  it('OPEN keeps only what still needs a bill', () => {
    expect(filterItems(rows, 'OPEN').map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('MISMATCH keeps only the bills that disagree with the record', () => {
    expect(filterItems(rows, 'MISMATCH').map((r) => r.id)).toEqual(['b']);
  });

  it('a state filter is the state, and ALL is everything', () => {
    expect(filterItems(rows, 'IN_LEDGER').map((r) => r.id)).toEqual(['c']);
    expect(filterItems(rows, 'ALL')).toHaveLength(4);
  });

  it('every state a backend can send has a label and a colour', () => {
    ['NO_BILL', 'AWAITING_OWNER', 'IN_LEDGER', 'TURNED_DOWN'].forEach((s) => {
      expect(STATE_STYLE[s]).toBeTruthy();
      expect(STATE_STYLE[s].label).not.toMatch(/paid/i);
    });
  });
});

describe('readingText: what the workshop bill reads (D4 OCR)', () => {
  it('a reviewed reading is a number with its confidence', () => {
    const t = readingText({ amount: 18000, kind: 'EXTRACTED', ocrConfidence: 88 });
    expect(t.figure).toBe('₹18,000');
    expect(t.note).toContain('88% OCR confidence');
  });
  it('a corrected reading keeps the OCR value beside it', () => {
    expect(readingText({ amount: 18500, kind: 'CORRECTED', ocrValue: 18000 }).note).toContain('OCR read ₹18,000');
  });
  it('an unreviewed reading is never the figure', () => {
    const t = readingText({ amount: null, missing: 'NOT_REVIEWED', proposal: 9100 });
    expect(t.figure).toBe('Awaiting review');
    expect(t.note).toContain('not trusted');
  });
  it('unknown is never ₹0', () => {
    expect(readingText({ amount: null, missing: 'BELOW_ORG_CONFIDENCE_FLOOR' }).figure).toBe('Not read');
    expect(readingText(null)).toBeNull();
  });
});
