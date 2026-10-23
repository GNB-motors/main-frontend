/**
 * Congestion map layer presentation (00_PLAN.md item 5).
 *
 * These tests exist to stop the three failure modes the rules call out:
 * a legend that reads as a speed rule, ours and the map's number blended into one, and a gap drawn anyway.
 */
import { describe, it, expect } from 'vitest';
import {
  SLOWEST_SLICE_COLOR,
  TYPICAL_COLOR,
  LIVE_COLOR,
  colorFor,
  hourLabel,
  legendOf,
  gapsOf,
  summaryOf,
  segmentsFrom,
  titleFor,
  topEdges,
} from './congestion';
import { encodePolyline6 } from './polyline6';

const geom = encodePolyline6([
  { lat: 19.0, lng: 74.7 },
  { lat: 19.1, lng: 74.8 },
]);

const row = (over = {}) => ({
  edgeKey: 'abc',
  roadClass: 'motorway',
  region: '03123',
  geom,
  label: 'SLOWEST_SLICE',
  layer: 'TYPICAL',
  index: 1.8,
  band: 1.5,
  ratioToBand: 1.2,
  bandEdges: 42,
  bandWeek: 2972,
  ours: { slownessSPerKm: 72, speedKmh: 21, freeFlowKmh: 50 },
  network: { engineKmh: 90, speedLimitKph: 100 },
  sample: { nightRows: 431, hourRows: 210, crossings: null },
  live: null,
  ...over,
});

const coverage = (over = {}) => ({
  how: 34,
  store: 'MONGO',
  truncated: false,
  band: {
    quantile: 0.9,
    minEdges: 30,
    minNightN: 20,
    binsWithHourEvidence: 12,
    binsMeasured: 9,
    weeks: [2971, 2972],
    measuredAt: '2026-10-20T18:30:00.000Z',
  },
  edges: { read: 820, rateable: 610, returned: 200, gaps: { NO_BAND: 40, THIN_BIN: 170 } },
  live: null,
  ...over,
});

describe('hourLabel', () => {
  it('names the IST hour a boundary was learned for', () => {
    expect(hourLabel(0)).toBe('Mon 00:00 IST');
    expect(hourLabel(34)).toBe('Tue 10:00 IST');
    expect(hourLabel(167)).toBe('Sun 23:00 IST');
  });

  it('an impossible hour says so rather than guessing', () => {
    expect(hourLabel(null)).toBe('this hour');
    expect(hourLabel(999)).toBe('this hour');
  });
});

describe('colorFor', () => {
  it('labels, not speeds, decide the colour', () => {
    expect(colorFor(row())).toBe(SLOWEST_SLICE_COLOR);
    expect(colorFor(row({ label: 'TYPICAL' }))).toBe(TYPICAL_COLOR);
  });

  it('the live layer never borrows the congested colour', () => {
    expect(colorFor(row({ layer: 'LIVE' }))).toBe(LIVE_COLOR);
  });
});

describe('titleFor — the sample travels with the number', () => {
  it('puts ours and the map figure side by side and the evidence after them', () => {
    const t = titleFor(row());
    expect(t).toContain('ours 21 km/h');
    expect(t).toContain('map 90 km/h');
    expect(t).toContain('×1.8 free flow');
    expect(t).toContain('boundary ×1.5 from 42 edges');
    expect(t).toContain('431 night rows, 210 hour observations');
  });

  it('a live row says how many crossings are behind it', () => {
    const t = titleFor(row({ layer: 'LIVE', sample: { nightRows: 431, hourRows: 210, crossings: 4 } }));
    expect(t).toContain('4 crossings in window');
  });
});

describe('segmentsFrom', () => {
  it('decodes the edge geometry and skips edges that have none', () => {
    const segs = segmentsFrom([row(), row({ edgeKey: 'nog', geom: null })]);
    expect(segs).toHaveLength(1);
    expect(segs[0].path).toHaveLength(2);
    expect(segs[0].path[0].lat).toBeCloseTo(19.0, 6);
  });

  it('a degenerate polyline draws nothing rather than a straight guess', () => {
    expect(segmentsFrom([row({ geom: encodePolyline6([{ lat: 1, lng: 1 }]) })])).toEqual([]);
  });

  it('a congested edge is drawn heavier than a typical one', () => {
    const [bad, good] = segmentsFrom([row(), row({ edgeKey: 'b', label: 'TYPICAL' })]);
    expect(bad.options.strokeWeight).toBeGreaterThan(good.options.strokeWeight);
    expect(bad.options.strokeOpacity).toBeGreaterThan(good.options.strokeOpacity);
  });
});

describe('legendOf — the legend states the rule, not a speed', () => {
  it('names the quantile, the road class, the hour and how many edges set it', () => {
    const [head] = legendOf(coverage());
    expect(head.detail).toContain('top 10%');
    expect(head.detail).toContain('this road class');
    expect(head.detail).toContain('Tue 10:00 IST');
    expect(head.detail).toContain('9 class×hour bins');
    expect(JSON.stringify(legendOf(coverage()))).not.toMatch(/\d+\s*km\/h/);
  });

  it('labels the slice as a rank and never as "congested"', () => {
    const [head] = legendOf(coverage());
    expect(head.label).toBe('Slowest 10% of your roads like this');
    expect(head.detail).toContain('a rank, not a jam');
    expect(JSON.stringify(legendOf(coverage()))).not.toMatch(/congested/i);
  });

  it('adds the live row only when the backend sent live coverage', () => {
    expect(legendOf(coverage()).map((l) => l.label)).toHaveLength(2);
    const withLive = legendOf(
      coverage({
        live: { windowMin: 30, gateP: 0.9, minCrossings: 3, crossings: 41, edgesLive: 6 },
      }),
    );
    expect(withLive).toHaveLength(3);
    expect(withLive[2].detail).toContain('Cadence limits this to trunk roads');
  });

  it('an unmeasured boundary says it is unmeasured', () => {
    const [head] = legendOf(
      coverage({ band: { quantile: 0.9, binsMeasured: 0, weeks: [], measuredAt: null } }),
    );
    expect(head.detail).toContain('boundary not measured');
    expect(head.detail).toContain('nothing below is a verdict');
  });
});

describe('gapsOf — undrawn edges are named, not silently missing', () => {
  it('turns the backend gap counts into words', () => {
    const gaps = gapsOf(coverage());
    expect(gaps).toHaveLength(2);
    expect(gaps[0].text).toContain('40 edges');
    expect(gaps[0].text).toContain('no learned boundary');
    expect(gaps[1].text).toContain('too few edges');
  });

  it('a single gap is not pluralised', () => {
    expect(gapsOf(coverage({ edges: { read: 1, gaps: { NO_BAND: 1 } } }))[0].text).toContain('1 edge ');
  });
});

describe('summaryOf', () => {
  it('always says how many of how many edges, and which store answered', () => {
    const s = summaryOf(coverage(), new Array(200).fill(row()));
    expect(s).toContain('200 of 820 edges rated');
    expect(s).toContain('org edge index');
    expect(s).toContain('210 not rated');
  });

  it('a truncated read is announced', () => {
    expect(summaryOf(coverage({ truncated: true }), [])).toContain('TRUNCATED');
  });

  it('no edges at all says why, instead of being blankly empty', () => {
    expect(summaryOf(coverage({ edges: { read: 0, gaps: {} } }), [])).toContain('no road-matched edges');
  });
});

describe('topEdges', () => {
  it('never returns more than asked for, and never fewer than exist', () => {
    const rows = [row(), row({ edgeKey: 'b' }), row({ edgeKey: 'c' })];
    expect(topEdges(rows, 2)).toHaveLength(2);
    expect(topEdges(rows, 99)).toHaveLength(3);
    expect(topEdges([], 5)).toEqual([]);
  });
});