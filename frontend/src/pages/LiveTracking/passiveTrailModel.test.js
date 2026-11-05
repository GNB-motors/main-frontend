import { describe, it, expect } from 'vitest';
import { buildPassiveTrail } from './passiveTrailModel.js';
const point = (lat, minute, gap = false) => ({ latitude: lat, longitude: 88, eventDateTime: `2026-11-04T10:0${minute}:00Z`, gap });
describe('passive trail', () => {
  it('splits raw fixes at a gap and makes the gap dotted', () => {
    const trail = buildPassiveTrail([point(22, 0), point(23, 1), point(24, 2, true), point(25, 3)], null);
    expect(trail.paths).toEqual([
      { pattern: 'dotted', path: [{ lat: 22, lng: 88 }, { lat: 23, lng: 88 }] },
      { pattern: 'dotted', path: [{ lat: 24, lng: 88 }, { lat: 25, lng: 88 }] },
      { pattern: 'dotted', path: [{ lat: 23, lng: 88 }, { lat: 24, lng: 88 }] },
    ]);
  });
});

describe('stops inside a plant', () => {
  const fix = (lat, lng, minute, over = {}) => ({ latitude: lat, longitude: lng, eventDateTime: `2026-11-04T1${Math.floor(minute / 60)}:${String(minute % 60).padStart(2, '0')}:00Z`, speed: 0, state: 'PARKED', ...over });

  it('a parked truck jittering in place becomes one stop, not a tangle of lines', () => {
    const trail = buildPassiveTrail([
      fix(22.5751, 88.1917, 0), fix(22.5753, 88.1915, 5), fix(22.5750, 88.1919, 10), fix(22.5752, 88.1916, 15),
    ], null);
    expect(trail.paths).toEqual([]);
    expect(trail.points).toHaveLength(1);
    expect(trail.stops).toHaveLength(1);
    expect(trail.stops[0]).toMatchObject({ fixes: 4, current: true });
    expect(trail.stops[0].lat).toBeCloseTo(22.57515, 4);
  });

  it('draws the line only between real moves, and an earlier stop is not "current"', () => {
    const trail = buildPassiveTrail([
      fix(22.5713, 88.1954, 0), fix(22.5714, 88.1953, 5),
      fix(22.573, 88.193, 10, { speed: 18, state: 'RUNNING' }),
      fix(22.5751, 88.1917, 20), fix(22.5752, 88.1917, 25),
    ], null);
    expect(trail.points).toHaveLength(3);
    expect(trail.paths).toHaveLength(1);
    expect(trail.paths[0].path).toHaveLength(3);
    expect(trail.stops.map(s => Boolean(s.current))).toEqual([false, true]);
  });

  it('a truck still moving at the end has no current stop', () => {
    const trail = buildPassiveTrail([fix(22.57, 88.19, 0), fix(22.58, 88.18, 10, { speed: 30, state: 'RUNNING' })], null);
    expect(trail.stops).toHaveLength(1);
    expect(trail.stops[0].current).toBeUndefined();
  });
});

describe('stationary comes from the fix, not the gap before it', () => {
  it('a moving fix tagged gapType stationary still splits the stops', () => {
    const p = (lat, m, speed, extra = {}) => ({ latitude: lat, longitude: 88.19, eventDateTime: `2026-11-04T17:${String(m).padStart(2, '0')}:00Z`, speed, state: speed ? 'ACTIVE' : 'PARKED', ...extra });
    const trail = buildPassiveTrail([p(22.571, 0, 0), p(22.5711, 5, 0), p(22.5723, 22, 7.4, { gapType: 'stationary' }), p(22.5752, 51, 0), p(22.5752, 53, 0)], null);
    expect(trail.stops).toHaveLength(2);
    expect(trail.stops.map(s => Boolean(s.current))).toEqual([false, true]);
    expect(trail.points).toHaveLength(3);
  });
});
