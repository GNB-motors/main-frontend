import { describe, it, expect } from 'vitest';
import {
  detectGaps,
  findMatchingCorridor,
  extractSubPath,
  habitualHalts,
  estimateGap,
  spliceTrail,
  toRenderSegments,
} from './gapRepair.js';

const MIN = 60_000;
const HOUR = 3600_000;
const T0 = Date.parse('2026-09-06T10:00:00Z');

/** Minimal synthetic frame — the module only reads lat/lng/at. */
const f = (lat, lng, atMinutes) => ({ lat, lng, at: T0 + atMinutes * MIN });

// A corridor running due east along lat 12 from lng 77 to 77.2.
const CORRIDOR = {
  originKey: 'Rampurhat',
  destinationKey: 'Illambazar',
  points: [
    { lat: 12, lng: 77 },
    { lat: 12, lng: 77.04 },
    { lat: 12, lng: 77.08 },
    { lat: 12, lng: 77.12 },
    { lat: 12, lng: 77.16 },
    { lat: 12, lng: 77.2 },
  ],
  medianDurationMinByHour: Array.from({ length: 24 }, () => null),
};

describe('detectGaps', () => {
  it('finds no gaps in a dense plausible trail', () => {
    const frames = [f(12, 77, 0), f(12.009, 77, 1), f(12.018, 77, 2)];
    expect(detectGaps(frames)).toEqual([]);
  });

  it('flags a silence of 10+ minutes with real displacement as a moving gap', () => {
    const frames = [f(12, 77, 0), f(12.05, 77.1, 30)]; // ~16 km in 30 min
    const gaps = detectGaps(frames);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].kind).toBe('moving');
    expect(gaps[0].gapMs).toBe(30 * MIN);
    expect(gaps[0].impliedKmph).toBeCloseTo(24, 0);
  });

  it('flags an implausible implied speed even under 10 minutes', () => {
    // 50 km in 5 minutes = 600 km/h — a hole, not driving.
    const frames = [f(12, 77, 0), f(12.45, 77, 5)];
    const gaps = detectGaps(frames);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].kind).toBe('moving');
  });

  it('classifies A≈B silence as stationary', () => {
    const frames = [f(12, 77, 0), f(12.0005, 77.0005, 60)];
    const gaps = detectGaps(frames);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].kind).toBe('stationary');
  });

  it('tolerates junk input', () => {
    expect(detectGaps(null)).toEqual([]);
    expect(detectGaps([])).toEqual([]);
  });
});

describe('findMatchingCorridor', () => {
  const gap = { fromIndex: 0, toIndex: 1, kind: 'moving' };
  const frames = [f(12, 77, 0), f(12, 77.2, 60)];

  it('matches a corridor passing near both endpoints in time-order', () => {
    const m = findMatchingCorridor(gap, frames, [CORRIDOR]);
    expect(m).not.toBeNull();
    expect(m.fromIdx).toBe(0);
    expect(m.toIdx).toBe(CORRIDOR.points.length - 1);
  });

  it('rejects a corridor whose direction runs opposite to time', () => {
    const reversed = { ...CORRIDOR, points: [...CORRIDOR.points].reverse() };
    // Reversed polyline: A matches index 5, B matches index 0 → refused.
    expect(findMatchingCorridor(gap, frames, [reversed])).toBeNull();
  });

  it('rejects corridors beyond endpoint tolerance', () => {
    const far = {
      points: [
        { lat: 20, lng: 70 },
        { lat: 21, lng: 70 },
      ],
    };
    expect(findMatchingCorridor(gap, frames, [far])).toBeNull();
  });

  it('skips corridors flagged tooSparseForDeviation', () => {
    const sparse = { ...CORRIDOR, tooSparseForDeviation: true };
    expect(findMatchingCorridor(gap, frames, [sparse])).toBeNull();
  });
});

describe('extractSubPath', () => {
  it('starts exactly at A and ends exactly at B', () => {
    const gap = { fromIndex: 0, toIndex: 1 };
    const frames = [f(12.001, 77.001, 0), f(12, 77.19, 60)];
    const path = extractSubPath(CORRIDOR, 0, 5, gap, frames);
    expect(path[0]).toEqual({ lat: 12.001, lng: 77.001 });
    expect(path[path.length - 1]).toEqual({ lat: 12, lng: 77.19 });
    // Interior corridor vertices are preserved in order (A, four corridor
    // points, B).
    expect(path).toHaveLength(6);
    expect(path[1]).toEqual({ lat: 12, lng: 77.04 });
    expect(path[4]).toEqual({ lat: 12, lng: 77.16 });
  });
});

describe('habitualHalts', () => {
  it('clusters recurring stationary visits and reports median dwell', () => {
    // Same spot visited 3 times for ~30, ~40, ~50 minutes.
    const frames = [];
    for (const [startMin, dwellMin] of [
      [0, 30],
      [200, 40],
      [400, 50],
    ]) {
      for (let m = 0; m <= dwellMin; m += 10) {
        frames.push(f(12.5, 77.5, startMin + m));
      }
    }
    const halts = habitualHalts(frames);
    expect(halts).toHaveLength(1);
    expect(halts[0].occurrences).toBe(3);
    expect(halts[0].medianDwellMs).toBe(40 * MIN);
    expect(halts[0].lat).toBeCloseTo(12.5, 3);
  });

  it('requires the minimum number of occurrences', () => {
    const frames = [f(12.5, 77.5, 0), f(12.5, 77.5, 20), f(12.5, 77.5, 40)];
    expect(habitualHalts(frames)).toEqual([]);
  });
});

describe('estimateGap', () => {
  it('stationary gaps draw nothing and explain themselves', () => {
    const frames = [f(12, 77, 0), f(12.0005, 77.0005, 60)];
    const est = estimateGap(
      { fromIndex: 0, toIndex: 1, kind: 'stationary', gapMs: 60 * MIN, gapKm: 0.1 },
      frames,
      {},
    );
    expect(est.path).toBeNull();
    expect(est.estimatedKm).toBe(0);
    expect(est.dwellMs).toBe(60 * MIN);
    expect(est.unexplainedMs).toBe(0);
    expect(est.label).toMatch(/stationary/);
  });

  it('moving gaps with a corridor match get inferred geometry and hour-median drive time', () => {
    const frames = [f(12, 77, 0), f(12, 77.2, 120)];
    const corridor = {
      ...CORRIDOR,
      medianDurationMinByHour: Array.from({ length: 24 }, () => null),
    };
    corridor.medianDurationMinByHour[10] = 90; // 10:00 UTC departure, 90 min median
    const gap = { fromIndex: 0, toIndex: 1, kind: 'moving', gapMs: 120 * MIN, gapKm: 21 };
    const est = estimateGap(gap, frames, { corridors: [corridor] });
    expect(est.provenance).toBe('CORRIDOR');
    expect(est.path.length).toBeGreaterThan(2);
    expect(est.estimatedKm).toBeGreaterThan(19);
    expect(est.driveMs).toBe(90 * MIN);
    expect(est.unexplainedMs).toBe(30 * MIN);
    expect(est.label).toMatch(/Rampurhat/);
  });

  it('moving gaps with habitual halts at both ends classify as inter-trip', () => {
    const frames = [f(12, 77, 0), f(13, 78.5, 120)];
    const halts = [
      { lat: 12, lng: 77, medianDwellMs: 30 * MIN, occurrences: 5 },
      { lat: 13, lng: 78.5, medianDwellMs: 20 * MIN, occurrences: 4 },
    ];
    const gap = { fromIndex: 0, toIndex: 1, kind: 'moving', gapMs: 120 * MIN, gapKm: 170 };
    const est = estimateGap(gap, frames, { corridors: [], halts });
    expect(est.kind).toBe('intertrip');
    expect(est.path).toBeNull();
    expect(est.unexplainedMs).toBe(120 * MIN);
  });

  it('moving gaps with no corridor and no halts keep the straight line and stay unexplained', () => {
    const frames = [f(12, 77, 0), f(13, 78.5, 120)];
    const gap = { fromIndex: 0, toIndex: 1, kind: 'moving', gapMs: 120 * MIN, gapKm: 170 };
    const est = estimateGap(gap, frames, { corridors: [], halts: [] });
    expect(est.kind).toBe('moving');
    expect(est.provenance).toBe('NONE');
    expect(est.estimatedKm).toBe(0);
    expect(est.unexplainedMs).toBe(120 * MIN);
  });
});

describe('spliceTrail', () => {
  it('marks measured frames and interpolates estimated corridor points in time', () => {
    const frames = [f(12, 77, 0), f(12, 77.2, 120), f(12, 77.209, 121)];
    const gap = { fromIndex: 0, toIndex: 1, kind: 'moving', gapMs: 120 * MIN, gapKm: 21 };
    const corridor = { ...CORRIDOR };
    const est = estimateGap(gap, frames, { corridors: [corridor] });
    const { frames: spliced, breaks } = spliceTrail(frames, [est]);

    expect(breaks).toEqual([]);
    const estimated = spliced.filter((p) => p.estimated);
    expect(estimated.length).toBeGreaterThan(0);
    // Estimated points sit strictly inside the gap and are time-ordered.
    for (const p of estimated) {
      expect(p.at).toBeGreaterThan(frames[0].at);
      expect(p.at).toBeLessThan(frames[1].at);
      expect(p.provenance).toBe('CORRIDOR');
    }
    // Measured frames pass through untouched and unmarked-estimated.
    expect(spliced.filter((p) => !p.estimated)).toHaveLength(3);
    expect(spliced[0].lat).toBe(12);
  });

  it('inserts a polyline break at inter-trip gaps instead of geometry', () => {
    const frames = [f(12, 77, 0), f(13, 78.5, 120), f(13.009, 78.5, 121)];
    const est = {
      fromIndex: 0,
      toIndex: 1,
      kind: 'intertrip',
      gapMs: 120 * MIN,
      path: null,
      driveMs: 0,
      provenance: 'NONE',
    };
    const { frames: spliced, breaks } = spliceTrail(frames, [est]);
    expect(breaks).toEqual([1]); // break BEFORE the post-gap frame
    expect(spliced).toHaveLength(3); // no invented geometry
    expect(spliced.every((p) => !p.estimated)).toBe(true);
  });

  it('passes a clean trail through unchanged', () => {
    const frames = [f(12, 77, 0), f(12.009, 77, 1)];
    const { frames: out, breaks } = spliceTrail(frames, []);
    expect(breaks).toEqual([]);
    expect(out).toHaveLength(2);
    expect(out.every((p) => p.estimated === false)).toBe(true);
  });

  it('recomputes cumulative figures across inserted estimated points', () => {
    const frames = [f(12, 77, 0), f(12, 77.2, 120), f(12.009, 77.2, 121)];
    const gap = { fromIndex: 0, toIndex: 1, kind: 'moving', gapMs: 120 * MIN, gapKm: 21 };
    const est = estimateGap(gap, frames, { corridors: [{ ...CORRIDOR }] });
    const { frames: spliced } = spliceTrail(frames, [est]);
    const last = spliced[spliced.length - 1];
    // ~21.5 km corridor + 1 km measured tail, not the raw 0 the inserts had.
    expect(last.cumulativeKm).toBeGreaterThan(21);
    for (let i = 1; i < spliced.length; i += 1) {
      expect(spliced[i].cumulativeKm).toBeGreaterThan(spliced[i - 1].cumulativeKm);
    }
  });
});

describe('toRenderSegments', () => {
  it('alternates measured/estimated runs and splits at breaks', () => {
    const frames = [
      f(12, 77, 0),
      f(12.009, 77, 1),
      f(12, 77.05, 31),
      f(12, 77.1, 61),
      f(12.009, 77.1, 62),
      f(12.018, 77.1, 63),
    ];
    frames[2].estimated = true;
    frames[3].estimated = true;
    const segments = toRenderSegments(frames, []);
    expect(segments.map((s) => s.estimated)).toEqual([false, true, false]);
    expect(segments[0].path).toHaveLength(2);
    expect(segments[1].path).toHaveLength(2);
    expect(segments[2].path).toHaveLength(2);
  });

  it('breaks the polyline at inter-trip break indices', () => {
    const frames = [f(12, 77, 0), f(12.009, 77, 1), f(13, 78.5, 120), f(13.009, 78.5, 121)];
    const segments = toRenderSegments(frames, [2]);
    // Without the break this would be one 4-point measured run; the break
    // forces two separate polylines — never a line between two real trips.
    expect(segments).toHaveLength(2);
    expect(segments[0].path).toHaveLength(2);
    expect(segments[1].path).toHaveLength(2);
  });

  it('tolerates junk input', () => {
    expect(toRenderSegments(null, null)).toEqual([]);
    expect(toRenderSegments([], [])).toEqual([]);
  });
});
