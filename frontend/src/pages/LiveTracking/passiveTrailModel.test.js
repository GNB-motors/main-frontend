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
