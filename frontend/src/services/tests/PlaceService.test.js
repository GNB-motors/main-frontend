import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  coordKey,
  dedupePoints,
  CACHE_LIMIT,
  resolvePlace,
  __resetPlaceCache,
} from '../PlaceService';
import apiClient from '../../utils/axiosConfig';

vi.mock('../../utils/axiosConfig', () => ({ default: { post: vi.fn() } }));

afterEach(() => {
  __resetPlaceCache();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('large fleet resolution', () => {
  it('resolves 401 distinct locations without exceeding the backend 200-point limit', async () => {
    vi.useFakeTimers();
    apiClient.post.mockImplementation(async (_url, { points }) => {
      if (points.length > 200) throw new Error('Too many points');
      return {
        data: {
          data: {
            places: Object.fromEntries(points.map((p) => [p.key, { label: `Place ${p.key}` }])),
          },
        },
      };
    });
    const pending = Array.from({ length: 401 }, (_, i) => resolvePlace(22 + i / 10000, 88));
    await vi.runAllTimersAsync();
    const places = await Promise.all(pending);
    expect(places.every((p) => p?.label.startsWith('Place '))).toBe(true);
    expect(apiClient.post.mock.calls.map(([, { points }]) => points.length)).toEqual([200, 200, 1]);
  });
});

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
