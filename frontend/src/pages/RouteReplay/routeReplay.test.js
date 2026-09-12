import { describe, it, expect } from 'vitest';
import {
  haversineKm,
  bearingDeg,
  toFrames,
  groundSpeedKmph,
  replayStats,
  positionAt,
  toLatLngPath,
} from './routeReplay.js';

// Two points ~111 km apart (1 degree of latitude at the equator).
const P0 = { lat: 0, lng: 0 };
const P1 = { lat: 1, lng: 0 };

const trail = (rows) =>
  rows.map(([lat, lng, iso, speed, course]) => ({
    latitude: lat,
    longitude: lng,
    eventDateTime: iso,
    speed: speed ?? null,
    courseDegrees: course ?? null,
  }));

describe('haversineKm', () => {
  it('measures a degree of latitude as ~111 km', () => {
    expect(haversineKm(P0, P1)).toBeCloseTo(111.19, 1);
  });

  it('is zero for identical points and safe on missing input', () => {
    expect(haversineKm(P0, P0)).toBe(0);
    expect(haversineKm(null, P1)).toBe(0);
    expect(haversineKm(P0, undefined)).toBe(0);
  });
});

describe('bearingDeg', () => {
  it('reads 0° due north and 90° due east', () => {
    expect(bearingDeg(P0, P1)).toBeCloseTo(0, 5);
    expect(bearingDeg(P0, { lat: 0, lng: 1 })).toBeCloseTo(90, 5);
  });

  it('normalises westward bearings into 0..360', () => {
    expect(bearingDeg(P0, { lat: 0, lng: -1 })).toBeCloseTo(270, 5);
  });
});

describe('toFrames', () => {
  it('sorts out-of-order fixes before computing distance', () => {
    // A later fix arriving first would otherwise draw a spike and corrupt
    // every cumulative figure after it.
    const frames = toFrames(
      trail([
        [1, 0, '2026-09-06T10:10:00Z'],
        [0, 0, '2026-09-06T10:00:00Z'],
      ]),
    );
    expect(frames.map((f) => f.lat)).toEqual([0, 1]);
    expect(frames[1].cumulativeKm).toBeCloseTo(111.19, 1);
  });

  it('drops fixes with no coordinates or an unparseable timestamp', () => {
    const frames = toFrames([
      { latitude: null, longitude: 1, eventDateTime: '2026-09-06T10:00:00Z' },
      { latitude: 1, longitude: null, eventDateTime: '2026-09-06T10:01:00Z' },
      { latitude: 1, longitude: 1, eventDateTime: 'not-a-date' },
      { latitude: 1, longitude: 1, eventDateTime: '2026-09-06T10:02:00Z' },
    ]);
    expect(frames).toHaveLength(1);
  });

  it('accumulates distance across the trail', () => {
    const frames = toFrames(
      trail([
        [0, 0, '2026-09-06T10:00:00Z'],
        [1, 0, '2026-09-06T11:00:00Z'],
        [2, 0, '2026-09-06T12:00:00Z'],
      ]),
    );
    expect(frames[0].cumulativeKm).toBe(0);
    expect(frames[2].cumulativeKm).toBeCloseTo(222.39, 1);
  });

  it('derives ground speed from distance over time, not the reported value', () => {
    // Device claims 5 km/h while actually covering 111 km in an hour.
    const frames = toFrames(
      trail([
        [0, 0, '2026-09-06T10:00:00Z', 5],
        [1, 0, '2026-09-06T11:00:00Z', 5],
      ]),
    );
    expect(frames[1].reportedSpeed).toBe(5);
    expect(frames[1].groundSpeedKmph).toBeCloseTo(111.19, 1);
  });

  it('prefers the reported course but falls back to computed bearing', () => {
    const frames = toFrames(
      trail([
        [0, 0, '2026-09-06T10:00:00Z'],
        [1, 0, '2026-09-06T11:00:00Z', null, 42],
        [2, 0, '2026-09-06T12:00:00Z'],
      ]),
    );
    expect(frames[1].heading).toBe(42);
    expect(frames[2].heading).toBeCloseTo(0, 5);
  });

  it('returns an empty array for junk input', () => {
    expect(toFrames(null)).toEqual([]);
    expect(toFrames(undefined)).toEqual([]);
    expect(toFrames([])).toEqual([]);
  });
});

describe('groundSpeedKmph', () => {
  it('returns null when no time elapsed, rather than a misleading zero', () => {
    expect(groundSpeedKmph(10, 0)).toBeNull();
    expect(groundSpeedKmph(10, -5)).toBeNull();
  });

  it('converts km over ms into km/h', () => {
    expect(groundSpeedKmph(60, 3600000)).toBeCloseTo(60, 6);
  });
});

describe('replayStats', () => {
  it('reports zeroed stats for an empty trail', () => {
    expect(replayStats([])).toEqual({
      pointCount: 0,
      distanceKm: 0,
      durationMs: 0,
      avgSpeedKmph: null,
      maxSpeedKmph: null,
    });
  });

  it('averages over the whole window, not across per-leg speeds', () => {
    // One fast 1-minute leg then a slow 2-hour leg. The mean of the two leg
    // speeds would be wildly optimistic; the window average is the honest one.
    const frames = toFrames(
      trail([
        [0, 0, '2026-09-06T10:00:00Z'],
        [0.1, 0, '2026-09-06T10:01:00Z'],
        [0.2, 0, '2026-09-06T12:01:00Z'],
      ]),
    );
    const stats = replayStats(frames);
    expect(stats.pointCount).toBe(3);
    expect(stats.distanceKm).toBeCloseTo(22.24, 1);
    expect(stats.durationMs).toBe(2 * 3600000 + 60000);
    expect(stats.avgSpeedKmph).toBeCloseTo(11.06, 1);
    expect(stats.maxSpeedKmph).toBeCloseTo(667.1, 0);
  });
});

describe('positionAt', () => {
  const frames = toFrames(
    trail([
      [0, 0, '2026-09-06T10:00:00Z'],
      [2, 0, '2026-09-06T12:00:00Z'],
    ]),
  );

  it('returns the endpoints at 0 and 1', () => {
    expect(positionAt(frames, 0).lat).toBeCloseTo(0, 6);
    expect(positionAt(frames, 1).lat).toBeCloseTo(2, 6);
  });

  it('interpolates on time, so halfway through the window is halfway along', () => {
    expect(positionAt(frames, 0.5).lat).toBeCloseTo(1, 6);
  });

  it('holds still while the vehicle is parked', () => {
    // Fixes at 10:00 and 10:01 then nothing until 12:00 — the first half of
    // the window is a stationary hour and must not skip ahead.
    const parked = toFrames(
      trail([
        [0, 0, '2026-09-06T10:00:00Z'],
        [0, 0, '2026-09-06T11:00:00Z'],
        [1, 0, '2026-09-06T12:00:00Z'],
      ]),
    );
    expect(positionAt(parked, 0.25).lat).toBeCloseTo(0, 6);
    expect(positionAt(parked, 0.5).lat).toBeCloseTo(0, 6);
    expect(positionAt(parked, 0.75).lat).toBeCloseTo(0.5, 6);
  });

  it('clamps out-of-range progress instead of extrapolating off the map', () => {
    expect(positionAt(frames, -3).lat).toBeCloseTo(0, 6);
    expect(positionAt(frames, 9).lat).toBeCloseTo(2, 6);
  });

  it('handles empty and single-point trails', () => {
    expect(positionAt([], 0.5)).toBeNull();
    const one = toFrames(trail([[5, 5, '2026-09-06T10:00:00Z']]));
    expect(positionAt(one, 0.5)).toMatchObject({ lat: 5, lng: 5, index: 0 });
  });

  it('does not divide by zero when every fix shares a timestamp', () => {
    const flat = toFrames(
      trail([
        [0, 0, '2026-09-06T10:00:00Z'],
        [1, 0, '2026-09-06T10:00:00Z'],
      ]),
    );
    expect(positionAt(flat, 0.5)).toMatchObject({ lat: 1 });
  });
});

describe('toLatLngPath', () => {
  it('maps frames to a google-maps path and tolerates empty input', () => {
    const frames = toFrames(
      trail([
        [1, 2, '2026-09-06T10:00:00Z'],
        [3, 4, '2026-09-06T11:00:00Z'],
      ]),
    );
    expect(toLatLngPath(frames)).toEqual([
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
    ]);
    expect(toLatLngPath(null)).toEqual([]);
  });
});
