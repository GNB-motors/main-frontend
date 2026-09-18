import { describe, it, expect } from 'vitest';
import { sortPulseBuckets } from './pulseBuckets';

describe('sortPulseBuckets', () => {
  it('sorts buckets ascending by bucketStart', () => {
    const data = {
      data: {
        buckets: [{ bucketStart: '2026-09-16T10:00:00Z' }, { bucketStart: '2026-09-16T09:00:00Z' }],
      },
    };
    const out = sortPulseBuckets(data);
    expect(out.map((b) => b.bucketStart)).toEqual(['2026-09-16T09:00:00Z', '2026-09-16T10:00:00Z']);
  });

  it('returns an empty array when the payload has no buckets', () => {
    expect(sortPulseBuckets(null)).toEqual([]);
    expect(sortPulseBuckets({})).toEqual([]);
    expect(sortPulseBuckets({ data: {} })).toEqual([]);
  });

  it('does not mutate the payload array', () => {
    const buckets = [
      { bucketStart: '2026-09-16T10:00:00Z' },
      { bucketStart: '2026-09-16T09:00:00Z' },
    ];
    const data = { data: { buckets } };
    sortPulseBuckets(data);
    expect(buckets[0].bucketStart).toBe('2026-09-16T10:00:00Z');
  });
});
