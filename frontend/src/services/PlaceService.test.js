import { describe, it, expect } from 'vitest';
import { coordKey, dedupePoints, CACHE_LIMIT } from './PlaceService';

describe('coordKey', () => {
  it('rounds to ~11 m grid', () => {
    expect(coordKey(22.57264, 88.36389)).toBe('22.5726,88.3639');
  });

  it('is stable across nearby fixes on the same grid cell', () => {
    expect(coordKey(22.57264, 88.36389)).toBe(coordKey(22.572641, 88.363891));
  });

  it('throws on non-numeric input', () => {
    expect(() => coordKey('abc', 88.36)).toThrow();
  });
});

describe('dedupePoints', () => {
  const p = (key) => ({ key, lat: 22.5, lng: 88.3 });

  it('removes duplicate keys, first occurrence wins', () => {
    expect(dedupePoints([p('a'), p('b'), p('a')])).toEqual([p('a'), p('b')]);
  });

  it('passes through an empty array', () => {
    expect(dedupePoints([])).toEqual([]);
  });

  it('skips null entries', () => {
    expect(dedupePoints([null, p('a')])).toEqual([p('a')]);
  });

  it('preserves insertion order', () => {
    expect(dedupePoints([p('x'), p('y'), p('z')])).toEqual([p('x'), p('y'), p('z')]);
  });
});

describe('cache budget', () => {
  it('exposes a bounded cache limit', () => {
    expect(CACHE_LIMIT).toBeGreaterThan(0);
    expect(CACHE_LIMIT).toBeLessThanOrEqual(50000);
  });
});
