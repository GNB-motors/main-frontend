import { describe, expect, it } from 'vitest';
import { compareBars, countText, sapDelta } from './deliveryRoutesModel';

const route = (over = {}) => ({
  n: 12,
  sap: { sapKm: 100, comparison: { verdict: 'OVER', deltaKm: 24.4 } },
  ...over,
});

describe('countText', () => {
  it('groups Indian style and keeps unknown as a dash', () => {
    expect(countText(3033)).toBe('3,033');
    expect(countText(123456)).toBe('1,23,456');
    expect(countText(0)).toBe('0');
    expect(countText(null)).toBe('—');
  });
});

describe('sapDelta', () => {
  it('signs the km and percent difference from SAP', () => {
    expect(sapDelta(route())).toEqual({ tone: 'over', km: '+24 km', pct: '+24%' });
    expect(
      sapDelta(route({ sap: { sapKm: 200, comparison: { verdict: 'UNDER', deltaKm: -50 } } })),
    ).toEqual({ tone: 'under', km: '−50 km', pct: '−25%' });
  });
  it('never invents a delta without a real verdict', () => {
    expect(sapDelta(route({ sap: undefined }))).toBeNull();
    expect(sapDelta(route({ n: 0 }))).toBeNull();
    expect(sapDelta(route({ sap: { sapKm: 100, comparison: { verdict: 'NO_KM' } } }))).toBeNull();
    expect(
      sapDelta(route({ sap: { sapKm: 100, comparison: { verdict: 'OVER', deltaKm: null } } })),
    ).toBeNull();
  });
  it('omits the percent when SAP km is unknown', () => {
    expect(
      sapDelta(route({ sap: { sapKm: 0, comparison: { verdict: 'WITHIN', deltaKm: 0 } } })),
    ).toEqual({ tone: 'within', km: '±0 km', pct: null });
  });
});

describe('compareBars', () => {
  it('scales both bars to the longer distance', () => {
    expect(compareBars(120, 100)).toEqual({ learned: 100, sap: 83 });
    expect(compareBars(null, 100)).toEqual({ learned: 0, sap: 100 });
    expect(compareBars(null, null)).toBeNull();
  });
});
