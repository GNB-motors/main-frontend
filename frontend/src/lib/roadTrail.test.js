import { describe, it, expect } from 'vitest';
import { decodePolyline6, encodePolyline6 } from './polyline6';
import {
  toLayers,
  distanceAtTime,
  clipLayersAt,
  positionAt,
  summaryOf,
  legendOf,
  stopsOf,
  toLatLngPairs,
} from './roadTrail';

const T0 = Date.UTC(2026, 9, 1, 0, 30);
const A = { lat: 22.0, lng: 88.0 };
const B = { lat: 22.009, lng: 88.0 };
const C = { lat: 22.018, lng: 88.0 };

const trail = {
  mode: 'MATCHED',
  calibrated: true,
  segments: [
    // 2,001.5 m of road in 120 s; the truck is slow in the first minute (500 m) and fast in the second
    {
      kind: 'MATCHED',
      t0: T0,
      t1: T0 + 120e3,
      distM: 2002,
      geom: encodePolyline6([A, B, C]),
      marks: [
        [T0, 0],
        [T0 + 60e3, 500],
        [T0 + 120e3, 2002],
      ],
    },
    { kind: 'UNKNOWN_GAP', t0: T0 + 120e3, t1: T0 + 900e3, gcM: 12000 },
    { kind: 'RAW', t0: T0 + 900e3, t1: T0 + 960e3, points: [C, { lat: 22.02, lng: 88.001 }] },
    { kind: 'STOP', t0: T0 + 960e3, t1: T0 + 2000e3, at: { lat: 22.02, lng: 88.001 } },
  ],
  distance: { roadM: 2002, matchedM: 2002 },
  timeline: [
    [T0, 0],
    [T0 + 60e3, 500],
    [T0 + 120e3, 2002],
  ],
};

describe('polyline6 (plan P4.8; pitfall L1)', () => {
  it('round-trips at 1e-6', () => {
    const back = decodePolyline6(encodePolyline6([A, { lat: -12.345678, lng: 77.000001 }]));
    expect(back[1].lat).toBeCloseTo(-12.345678, 6);
    expect(back[1].lng).toBeCloseTo(77.000001, 6);
  });
  it('empty input is an empty path', () => {
    expect(decodePolyline6('')).toEqual([]);
    expect(decodePolyline6(null)).toEqual([]);
  });
});

describe('roadTrail (plan P4.8)', () => {
  it('a GPS gap the fleet can drive is the road, dashed; a GPS fault draws nothing', () => {
    const segments = [
      { kind: 'INFERRED', t0: T0, t1: T0 + 600e3, distM: 15350, geom: encodePolyline6([A, B, C]) },
      { kind: 'IMPOSSIBLE', t0: T0 + 600e3, t1: T0 + 840e3, gcM: 13007, geom: null },
    ];
    const layers = toLayers({ mode: 'MATCHED', segments });
    expect(layers.map((l) => [l.kind, l.pattern, l.distM])).toEqual([
      ['INFERRED', 'dashed', 15350],
    ]);
  });

  it('turns segments into styled layers; gaps and stops draw no line', () => {
    const layers = toLayers(trail);
    expect(layers.map((l) => [l.kind, l.pattern])).toEqual([
      ['MATCHED', 'solid'],
      ['RAW', 'dotted'],
    ]);
    expect(layers[0].path).toHaveLength(3);
    expect(stopsOf(trail)).toEqual([
      { at: { lat: 22.02, lng: 88.001 }, t0: T0 + 960e3, t1: T0 + 2000e3 },
    ]);
  });

  it('road-distance clock interpolates the timeline and clamps at the ends', () => {
    expect(distanceAtTime(trail.timeline, T0 + 30e3)).toBe(250);
    expect(distanceAtTime(trail.timeline, T0 + 90e3)).toBe(1251);
    expect(distanceAtTime(trail.timeline, T0 - 1)).toBe(0);
    expect(distanceAtTime(trail.timeline, T0 + 1e9)).toBe(2002);
    expect(distanceAtTime([], T0)).toBeNull();
  });

  it('replay clipping follows the distance marks, not elapsed time', () => {
    const layers = toLayers(trail);
    // at 60 s the truck has driven 500 of 2,002 m: a quarter of the road, not half
    const pos = positionAt(layers, T0 + 60e3);
    expect(pos.lat).toBeCloseTo(22.0 + 0.018 * (500 / 2002), 4);
    const clipped = clipLayersAt(layers, T0 + 60e3);
    expect(clipped).toHaveLength(1);
    expect(clipped[0].partial).toBe(true);
    expect(clipped[0].path[clipped[0].path.length - 1].lat).toBeCloseTo(pos.lat, 6);
    expect(clipLayersAt(layers, T0 + 1000e3)).toHaveLength(2);
  });

  it('no on-road position inside a gap or on raw fixes', () => {
    const layers = toLayers(trail);
    expect(positionAt(layers, T0 + 500e3)).toBeNull();
    expect(positionAt(layers, T0 + 930e3)).toBeNull();
  });

  it('distance summary carries an honest label', () => {
    expect(summaryOf(trail)).toEqual({ km: 2.002, label: 'on roads', certified: true });
    expect(
      summaryOf({ mode: 'RAW_ONLY', distance: { roadM: null, straightLineWithinDrivesM: 1500 } }),
    ).toEqual({
      km: 1.5,
      label: 'straight-line estimate (no road data yet)',
      certified: false,
    });
    expect(summaryOf(null)).toBeNull();
  });

  it('legend lists only the kinds present, in a fixed order', () => {
    expect(legendOf(toLayers(trail)).map((x) => x.kind)).toEqual(['MATCHED', 'RAW']);
  });

  it('Leaflet pairs', () => {
    expect(toLatLngPairs([A, B])).toEqual([
      [22, 88],
      [22.009, 88],
    ]);
  });
});
