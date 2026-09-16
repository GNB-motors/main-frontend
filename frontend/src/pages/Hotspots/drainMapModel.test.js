import { describe, it, expect } from 'vitest';
import {
  rangeFromDays,
  toBboxString,
  boundsToBox,
  severityOf,
  bucketRadiusMeters,
  bucketStyle,
  maxInrOf,
  summariseBuckets,
} from './drainMapModel.js';

describe('rangeFromDays', () => {
  it('returns an ISO window ending at now spanning the given days', () => {
    const now = Date.UTC(2026, 0, 31); // 2026-01-31
    const { from, to } = rangeFromDays(30, now);
    expect(to).toBe(new Date(now).toISOString());
    expect(from).toBe(new Date(Date.UTC(2026, 0, 1)).toISOString());
  });
});

describe('toBboxString', () => {
  it('emits minLng,minLat,maxLng,maxLat order', () => {
    expect(toBboxString({ west: 87.5, south: 22.2, east: 88.1, north: 22.7 })).toBe(
      '87.5,22.2,88.1,22.7',
    );
  });
  it('returns null when any edge is missing or non-finite', () => {
    expect(toBboxString({ west: 87.5, south: 22.2, east: 88.1 })).toBeNull();
    expect(toBboxString({ west: NaN, south: 1, east: 2, north: 3 })).toBeNull();
    expect(toBboxString()).toBeNull();
  });
});

describe('boundsToBox', () => {
  it('reads a Google LatLngBounds-like object', () => {
    const bounds = {
      getSouthWest: () => ({ lat: () => 22.2, lng: () => 87.5 }),
      getNorthEast: () => ({ lat: () => 22.7, lng: () => 88.1 }),
    };
    expect(boundsToBox(bounds)).toEqual({ west: 87.5, south: 22.2, east: 88.1, north: 22.7 });
  });
  it('returns null for a non-bounds value', () => {
    expect(boundsToBox(null)).toBeNull();
    expect(boundsToBox({})).toBeNull();
  });
});

describe('severityOf', () => {
  it('tiers a bucket by its share of the heaviest ₹ loss', () => {
    expect(severityOf(100, 100).key).toBe('critical');
    expect(severityOf(60, 100).key).toBe('high');
    expect(severityOf(30, 100).key).toBe('medium');
    expect(severityOf(5, 100).key).toBe('low');
  });
  it('treats a zero max as all-low (no division by zero)', () => {
    expect(severityOf(0, 0).key).toBe('low');
  });
});

describe('bucketRadiusMeters', () => {
  it('clamps to the floor for a tiny drain and grows with litres', () => {
    expect(bucketRadiusMeters(0)).toBe(400);
    expect(bucketRadiusMeters(100)).toBeGreaterThan(400);
    expect(bucketRadiusMeters(1e9)).toBe(4000); // capped
  });
});

describe('bucketStyle', () => {
  it('combines severity colour and litre-scaled radius', () => {
    const style = bucketStyle({ estimatedInr: 100, totalLitres: 0 }, 100);
    expect(style.tier).toBe('critical');
    expect(style.color).toBe('#DC2626');
    expect(style.radiusMeters).toBe(400);
  });
});

describe('maxInrOf', () => {
  it('finds the heaviest bucket ₹ loss, 0 for empty', () => {
    expect(maxInrOf([{ estimatedInr: 10 }, { estimatedInr: 90 }])).toBe(90);
    expect(maxInrOf([])).toBe(0);
  });
});

describe('summariseBuckets', () => {
  it('rolls up cells, litres, ₹, events and DISTINCT vehicles', () => {
    const buckets = [
      {
        count: 2,
        totalLitres: 20,
        estimatedInr: 1900,
        vehicleIds: ['a', 'b'],
        vehicles: ['R1', 'R2'],
      },
      { count: 1, totalLitres: 30, estimatedInr: 2850, vehicleIds: ['b'], vehicles: ['R2'] },
    ];
    const s = summariseBuckets(buckets);
    expect(s.cells).toBe(2);
    expect(s.events).toBe(3);
    expect(s.totalLitres).toBe(50);
    expect(s.totalInr).toBe(4750);
    expect(s.vehicles).toBe(2); // a, b — deduped across cells
  });
  it('counts registration-only vehicles when no id was resolved', () => {
    const s = summariseBuckets([
      { count: 1, totalLitres: 5, estimatedInr: 475, vehicleIds: [], vehicles: ['R9'] },
    ]);
    expect(s.vehicles).toBe(1);
  });
  it('is safe on an empty list', () => {
    expect(summariseBuckets([])).toEqual({
      cells: 0,
      events: 0,
      totalLitres: 0,
      totalInr: 0,
      vehicles: 0,
    });
  });
});
