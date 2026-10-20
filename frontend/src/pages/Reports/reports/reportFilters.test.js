import { describe, expect, it } from 'vitest';
import {
  compactParams,
  istDayEnd,
  istDayStart,
  istDaysAgo,
  istToday,
  matchesSearch,
  pageCount,
  pageSlice,
  rangeLabel,
} from './reportFilters';

describe('IST days', () => {
  it('bounds a day with an explicit IST offset', () => {
    expect(istDayStart('2026-10-14')).toBe('2026-10-14T00:00:00.000+05:30');
    expect(istDayEnd('2026-10-14')).toBe('2026-10-14T23:59:59.999+05:30');
    expect(istDayStart('')).toBeUndefined();
  });

  it('reads today in IST even when UTC is still on the previous day', () => {
    // 20:00 UTC on the 13th is 01:30 IST on the 14th.
    expect(istToday(new Date('2026-10-13T20:00:00Z'))).toBe('2026-10-14');
    expect(istDaysAgo(30, new Date('2026-10-13T20:00:00Z'))).toBe('2026-09-14');
  });
});

describe('compactParams', () => {
  it('drops empty, null and "all" values', () => {
    expect(compactParams({ a: '', b: null, c: undefined, d: 'all', e: 'x', f: 0 })).toEqual({
      e: 'x',
      f: 0,
    });
  });
});

describe('matchesSearch', () => {
  it('matches any field, ignoring case', () => {
    expect(matchesSearch('ramesh', ['Ramesh Kumar', '98300'])).toBe(true);
    expect(matchesSearch('suresh', ['Ramesh Kumar'])).toBe(false);
  });

  it('matches plates with spaces or dashes left out', () => {
    expect(matchesSearch('wb 25 r', ['WB25R9540'])).toBe(true);
    expect(matchesSearch('WB25R', ['WB-25-R-9540'])).toBe(true);
  });

  it('matches everything for an empty query and skips missing fields', () => {
    expect(matchesSearch('  ', [null])).toBe(true);
    expect(matchesSearch('x', [null, undefined])).toBe(false);
  });
});

describe('paging', () => {
  const rows = Array.from({ length: 23 }, (_, i) => i);

  it('counts pages, never fewer than one', () => {
    expect(pageCount(23, 10)).toBe(3);
    expect(pageCount(0, 10)).toBe(1);
  });

  it('slices a page and clamps an out-of-range page', () => {
    expect(pageSlice(rows, 3, 10)).toEqual([20, 21, 22]);
    expect(pageSlice(rows, 9, 10)).toEqual([20, 21, 22]);
    expect(pageSlice(rows, 0, 10)).toEqual(rows.slice(0, 10));
  });

  it('labels the visible range', () => {
    expect(rangeLabel(2, 10, 23)).toBe('11–20 of 23');
    expect(rangeLabel(3, 10, 23)).toBe('21–23 of 23');
    expect(rangeLabel(1, 10, 0)).toBe('0');
  });
});
