import { describe, it, expect } from 'vitest';
import { mapModel, splitTrack, timelineModel } from './deviationMapModel';

const T = (h, m = 0) => new Date(2026, 9, 14, h, m).toISOString();
const fix = (h, m, lat, lng, extra = {}) => ({
  eventDateTime: T(h, m),
  latitude: lat,
  longitude: lng,
  ...extra,
});

describe('splitTrack', () => {
  it('splits at the pickup departure and joins the two lines', () => {
    const pts = [fix(8, 0, 1, 1), fix(9, 0, 2, 2), fix(10, 0, 3, 3), fix(11, 0, 4, 4)];
    const { approach, laden } = splitTrack(pts, new Date(T(9, 30)).getTime());
    expect(approach).toEqual([
      [
        [1, 1],
        [2, 2],
      ],
    ]);
    expect(laden).toEqual([
      [
        [2, 2],
        [3, 3],
        [4, 4],
      ],
    ]);
  });

  it('never draws across a GPS gap', () => {
    const pts = [
      fix(10, 0, 1, 1),
      fix(10, 5, 2, 2),
      fix(12, 0, 5, 5, { break: true }),
      fix(12, 5, 6, 6),
    ];
    const { laden } = splitTrack(pts, null);
    expect(laden).toHaveLength(2);
    expect(laden[1][0]).toEqual([5, 5]);
  });

  it('drops fixes without coordinates and lines of one point', () => {
    const pts = [fix(10, 0, null, 1), fix(10, 5, 2, 2)];
    expect(splitTrack(pts, null).laden).toEqual([]);
  });
});

const detail = {
  event: { _id: 'e1', maxOffKm: 6.24, startedAt: T(13, 0), endedAt: T(13, 40) },
  detour: {
    exitPoint: { lat: 22.5, lng: 88.3, at: T(12, 58) },
    maxOffPoint: { lat: 22.55, lng: 88.45, at: T(13, 20) },
    rejoinPoint: { lat: 22.6, lng: 88.4, at: T(13, 42) },
    path: [
      { lat: 22.52, lng: 88.4, at: T(13, 0) },
      { lat: 22.55, lng: 88.45, at: T(13, 20) },
    ],
  },
  corridor: {
    band: [
      { lat: 22.5, lng: 88.3 },
      { lat: null, lng: 1 },
    ],
    line: [
      { lat: 22.5, lng: 88.3 },
      { lat: 22.6, lng: 88.4 },
    ],
  },
  trip: {
    pickup: { name: 'Plant A', lat: 22.4, lng: 88.2, departedAt: T(12, 0) },
    drops: [{ name: 'Durgapur Site', lat: 22.7, lng: 88.5, arrivedAt: T(15, 0) }],
  },
  track: {
    from: T(10, 0),
    to: T(15, 0),
    points: [fix(11, 0, 22.3, 88.1), fix(12, 0, 22.4, 88.2), fix(14, 0, 22.6, 88.4)],
  },
};

describe('mapModel', () => {
  const m = mapModel(detail);

  it('draws the detour from where it left to where it came back', () => {
    expect(m.detour[0]).toEqual([22.5, 88.3]);
    expect(m.detour[m.detour.length - 1]).toEqual([22.6, 88.4]);
    expect(m.detour).toHaveLength(4);
  });

  it('marks the pickup, the drop and the three detour points with readable labels', () => {
    expect(m.markers.map((x) => x.kind)).toEqual(['pickup', 'drop', 'exit', 'maxOff', 'rejoin']);
    expect(m.markers.find((x) => x.kind === 'maxOff').label).toBe(
      'Farthest point: 6.2 km off the usual route',
    );
    expect(m.markers.find((x) => x.kind === 'exit').label).toBe('Left the usual route · 12:58');
  });

  it('zooms to the detour by default and has a whole-trip view', () => {
    expect(m.bounds.detour).toBe(m.detour);
    expect(m.bounds.trip.length).toBeGreaterThan(m.detour.length);
    expect(m.band).toEqual([[22.5, 88.3]]);
    expect(m.usual).toEqual([
      [22.5, 88.3],
      [22.6, 88.4],
    ]);
  });

  it('no usual-route line on a corridor built before it existed', () => {
    expect(mapModel({ ...detail, corridor: { band: [] } }).usual).toEqual([]);
  });

  it('a run outside any trip draws its context track as one neutral line', () => {
    const out = mapModel({ ...detail, trip: null });
    expect(out.approach).toEqual([]);
    expect(out.laden).toHaveLength(1);
    expect(out.markers.map((x) => x.kind)).toEqual(['exit', 'maxOff', 'rejoin']);
  });

  it('old events without geometry fall back to the trip bounds', () => {
    const out = mapModel({ ...detail, detour: { path: [] } });
    expect(out.detour).toEqual([]);
    expect(out.bounds.detour).toBe(out.bounds.trip);
  });
});

describe('timelineModel', () => {
  it('places the loaded stretch and every detour of the trip on one bar', () => {
    const tl = timelineModel(detail, [
      { _id: 'e0', startedAt: T(11, 0), endedAt: T(11, 15) },
      detail.event,
    ]);
    expect(tl.ladenLeft).toBeCloseTo(40);
    expect(tl.bands.map((b) => [b.id, b.current])).toEqual([
      ['e0', false],
      ['e1', true],
    ]);
    expect(tl.bands[1].left).toBeCloseTo(60);
    expect(tl.bands[1].width).toBeCloseTo((40 / 300) * 100);
  });

  it('adds the selected event when the feed page does not hold it', () => {
    const tl = timelineModel(detail, []);
    expect(tl.bands.map((b) => b.id)).toEqual(['e1']);
  });

  it('nothing to draw without a track window', () => {
    expect(timelineModel({ ...detail, track: null })).toBeNull();
  });
});
