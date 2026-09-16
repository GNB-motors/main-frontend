import { describe, it, expect } from 'vitest';
import {
  indexBuckets,
  colorForValue,
  opacityForSamples,
  p50Range,
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
