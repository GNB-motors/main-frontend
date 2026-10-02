import { describe, it, expect } from 'vitest';
import { toFrames, applyRoadDistance, replayStats } from './routeReplay.js';

const iso = (min) => new Date(Date.UTC(2026, 9, 1, 0, 30 + min)).toISOString();
const T = (min) => Date.UTC(2026, 9, 1, 0, 30 + min);
const points = [0, 1, 2, 20].map((m, i) => ({
  latitude: 22 + i * 0.009,
  longitude: 88,
  eventDateTime: iso(m),
}));

describe('applyRoadDistance (plan P4.10; maths R2)', () => {
  it('uses road metres from the timeline; an unknown gap adds nothing', () => {
    const timeline = [
      [T(0), 0],
      [T(1), 1200],
      [T(2), 2500],
      // 2 -> 20 min: unknown gap, the road clock stays at 2,500 m
      [T(20), 2500],
    ];
    const frames = applyRoadDistance(toFrames(points), timeline);
    expect(frames.map((f) => Math.round(f.cumulativeKm * 1000))).toEqual([0, 1200, 2500, 2500]);
    expect(frames[1].groundSpeedKmph).toBeCloseTo(72, 6); // 1.2 km in 1 min
    expect(frames.every((f) => f.distanceSource === 'road')).toBe(true);
    expect(replayStats(frames).distanceKm).toBeCloseTo(2.5, 6);
  });

  it('without a timeline the straight-line figures stay and say so', () => {
    const frames = applyRoadDistance(toFrames(points), []);
    expect(frames[3].distanceSource).toBe('straight-line');
    expect(frames[3].cumulativeKm).toBeGreaterThan(2.9);
  });
});
