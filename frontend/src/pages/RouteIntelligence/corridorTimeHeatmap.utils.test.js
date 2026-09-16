import { describe, it, expect } from 'vitest';
import {
  indexBuckets,
  colorForValue,
  opacityForSamples,
  p50Range,
  formatMinutes,
  formatHour12,
  formatHour24,
  utcToIst,
  istToUtc,
  computeCorridorInsights,
  SEQUENTIAL_RAMP,
  NO_DATA_COLOR,
} from './corridorTimeHeatmap.utils.js';

describe('indexBuckets', () => {
  it('keys buckets by hour_dow for O(1) lookup', () => {
    const buckets = [{ hour: 9, dow: 1, p50Min: 40 }];
    const byKey = indexBuckets(buckets);
    expect(byKey.get('9_1')).toEqual(buckets[0]);
    expect(byKey.get('9_2')).toBeUndefined();
  });

  it('handles an empty/missing list', () => {
    expect(indexBuckets(undefined).size).toBe(0);
    expect(indexBuckets([]).size).toBe(0);
  });
});

describe('colorForValue', () => {
  it('returns the no-data color for a null value', () => {
    expect(colorForValue(null, 10, 50)).toBe(NO_DATA_COLOR);
  });

  it('maps the minimum to the lightest ramp step and the maximum to the darkest', () => {
    expect(colorForValue(10, 10, 50)).toBe(SEQUENTIAL_RAMP[0]);
    expect(colorForValue(50, 10, 50)).toBe(SEQUENTIAL_RAMP[SEQUENTIAL_RAMP.length - 1]);
  });

  it('falls back to a mid-ramp step when every bucket shares the same value', () => {
    expect(colorForValue(30, 30, 30)).toBe(SEQUENTIAL_RAMP[Math.floor(SEQUENTIAL_RAMP.length / 2)]);
  });
});

describe('opacityForSamples', () => {
  it('fades a single-sample bucket the most', () => {
    expect(opacityForSamples(1)).toBeLessThan(opacityForSamples(2));
    expect(opacityForSamples(2)).toBeLessThan(opacityForSamples(5));
  });

  it('is fully opaque at 5+ samples', () => {
    expect(opacityForSamples(5)).toBe(1);
    expect(opacityForSamples(40)).toBe(1);
  });
});

describe('p50Range', () => {
  it('finds the min/max across populated buckets, ignoring nulls', () => {
    const buckets = [{ p50Min: 30 }, { p50Min: null }, { p50Min: 55 }, { p50Min: 42 }];
    expect(p50Range(buckets)).toEqual({ min: 30, max: 55 });
  });

  it('returns nulls when nothing is populated', () => {
    expect(p50Range([])).toEqual({ min: null, max: null });
    expect(p50Range([{ p50Min: null }])).toEqual({ min: null, max: null });
  });
});

describe('formatMinutes', () => {
  it('formats hours and minutes correctly', () => {
    expect(formatMinutes(135)).toBe('2h 15m');
    expect(formatMinutes(120)).toBe('2h');
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(null)).toBe('—');
  });
});

describe('formatHour12 & formatHour24', () => {
  it('formats 12h labels cleanly', () => {
    expect(formatHour12(0)).toBe('12 AM');
    expect(formatHour12(9)).toBe('9 AM');
    expect(formatHour12(12)).toBe('12 PM');
    expect(formatHour12(18)).toBe('6 PM');
  });

  it('formats 24h timestamps', () => {
    expect(formatHour24(4)).toBe('04:00');
    expect(formatHour24(17)).toBe('17:00');
  });
});

describe('utcToIst & istToUtc', () => {
  it('converts UTC to IST adding 5.5 hours', () => {
    const res = utcToIst(0, 1); // 00:00 UTC Monday -> ~06:00 IST Monday
    expect(res.istHour).toBe(6);
    expect(res.istDOW).toBe(1);
  });

  it('handles day-of-week roll over for late UTC hours', () => {
    const res = utcToIst(20, 1); // 20:00 UTC Monday -> 01:30 IST Tuesday
    expect(res.istHour).toBe(2);
    expect(res.istDOW).toBe(2);
  });

  it('inverts cleanly with istToUtc', () => {
    const { utcHour, utcDow } = istToUtc(6, 1);
    expect(utcHour).toBe(0);
    expect(utcDow).toBe(1);
  });
});

describe('computeCorridorInsights', () => {
  it('extracts optimal window, peak congestion, and variance', () => {
    const sampleBuckets = [
      { hour: 3, dow: 1, p50Min: 120, p90Min: 140, samples: 10 },
      { hour: 4, dow: 1, p50Min: 125, p90Min: 145, samples: 10 },
      { hour: 5, dow: 1, p50Min: 130, p90Min: 150, samples: 10 },
      { hour: 17, dow: 1, p50Min: 210, p90Min: 250, samples: 15 },
      { hour: 18, dow: 1, p50Min: 220, p90Min: 260, samples: 15 },
      { hour: 19, dow: 1, p50Min: 215, p90Min: 255, samples: 15 },
    ];

    const insights = computeCorridorInsights(sampleBuckets);
    expect(insights.hasData).toBe(true);
    expect(insights.minP50).toBe(120);
    expect(insights.maxP50).toBe(220);
    expect(insights.delayDeltaMin).toBe(100);
    expect(insights.delayDeltaPct).toBeGreaterThan(0);
    expect(insights.totalSamples).toBe(75);
    expect(insights.avgBufferMin).toBeGreaterThan(0);
  });
});
