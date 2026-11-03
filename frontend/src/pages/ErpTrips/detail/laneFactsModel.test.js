import { describe, expect, it, test } from 'vitest';
import { laneTimeLabel, tollQuoteLabel } from './laneFactsModel';

describe('usual time on a lane', () => {
  it('says the P50 with one decimal, and the P90 when it is there', () => {
    expect(
      laneTimeLabel({ stats: { sampleSize: 20, median: 6.24, p90: 8.94 } }),
    ).toBe('Usual on this lane: 6.2 h (slow days 8.9 h)');
  });

  it('says nothing at all when there is no row for the lane', () => {
    expect(laneTimeLabel(null)).toBeNull();
    expect(laneTimeLabel([])).toBeNull();
    expect(laneTimeLabel({ stats: { sampleSize: 0, median: null } })).toBeNull();
  });

  it('flags a lane that has almost no history behind it', () => {
    expect(laneTimeLabel({ stats: { sampleSize: 2, median: 5 } })).toContain('only 2 trips');
  });
});

describe('toll quote', () => {
  it('reads the rupee total and the plaza count', () => {
    expect(
      tollQuoteLabel({
        boothCount: 3,
        totals: { multiaxle: { singleInr: 1240, unknown: 0 } },
      }),
    ).toBe('Toll estimate: ₹1,240 across 3 plazas');
  });

  it('has no number to read when there is no quote', () => {
    expect(tollQuoteLabel(null)).toBeNull();
    expect(tollQuoteLabel({ totals: {} })).toBeNull();
  });
});

describe('review fixes', () => {
  test('the corridor p75 (the API has no p90) gives the slow-side line', () => {
    expect(laneTimeLabel({ stats: { median: 38.5, p75: 41, sampleSize: 23 } })).toBe(
      'Usual on this lane: 38.5 h (3 in 4 trips under 41.0 h)',
    );
  });
  test('a quote with no priced booth is unavailable, never ₹0', () => {
    expect(
      tollQuoteLabel({ boothCount: 3, totals: { multiaxle: { singleInr: 0, priced: 0, unknown: 3 } } }),
    ).toBeNull();
  });
});

