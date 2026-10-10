import { describe, it, expect } from 'vitest';
import {
  routeMapPoints,
  isCurrentDrop,
  canMarkPlace,
  stopLabel,
  answerPlaceHref,
  fmtDuration,
  fmtKm,
  fmtDateRange,
  tripDateRange,
  stopsOnWayText,
  stopKind,
  timelineRows,
  timelinePlan,
  fmtDay,
  inWindow,
  notReachedYet,
  tripRoadLayers,
  tripRoadAt,
} from './autoTripModel';
import { encodePolyline6 } from '../../lib/polyline6';

const pickup = { lat: 22.5, lng: 88.2, name: 'AMBUJA' };
const drop = { lat: 21.9, lng: 87.5, arrivedAt: '2026-09-20T13:00:00Z' };

describe('routeMapPoints', () => {
  it('draws pickup → stops in order and keeps the drop out of the plain dots', () => {
    const pts = routeMapPoints({
      pickup,
      drop,
      routeStops: [
        { _id: 'a', lat: 22.2, lng: 87.9 },
        { _id: 'b', lat: 21.9, lng: 87.5 }, // the drop itself
      ],
    });
    expect(pts.path).toHaveLength(3);
    expect(pts.stops.map((s) => s.id)).toEqual(['a']);
    expect(pts.all).toHaveLength(4); // path + D
  });

  it('labels further drops D2, D3 with stable ids', () => {
    const pts = routeMapPoints({
      pickup,
      drop,
      extraDrops: [{ lat: 21.8, lng: 87.7, arrivedAt: '2026-09-20T15:00:00Z' }],
    });
    expect(pts.extras[0]).toMatchObject({ label: 'D2', id: 'drop-2026-09-20T15:00:00Z' });
  });

  it('copes with a trip that has nothing mapped yet', () => {
    expect(routeMapPoints({}).all).toEqual([]);
  });
});

describe('stop helpers', () => {
  it('isCurrentDrop matches on arrival time', () => {
    expect(isCurrentDrop({ startAt: '2026-09-20T13:00:00.000Z' }, { drop })).toBe(true);
    expect(isCurrentDrop({ startAt: '2026-09-20T12:00:00Z' }, { drop })).toBe(false);
  });

  it('canMarkPlace: unconfirmed or non-drop places yes; drop places and yards no', () => {
    const at = (place) => ({ orgSiteId: 'p1', place });
    expect(canMarkPlace(at({ status: 'PROPOSED', siteType: 'UNKNOWN' }))).toBe(true);
    expect(canMarkPlace(at({ status: 'CONFIRMED', siteType: 'UNKNOWN' }))).toBe(true);
    expect(canMarkPlace(at({ status: 'CONFIRMED', siteType: 'UNLOADING' }))).toBe(false);
    expect(canMarkPlace(at({ status: 'CONFIRMED', siteType: 'WAREHOUSE' }))).toBe(false);
    expect(canMarkPlace({ orgSiteId: null })).toBe(false);
  });

  it('stopLabel prefers the place name, then what the truck was doing', () => {
    expect(stopLabel({ place: { name: 'EGRA' } })).toBe('EGRA');
    expect(stopLabel({ place: { status: 'PROPOSED' } })).toBe('Unconfirmed place');
    expect(stopLabel({ purpose: { top: 'FUEL' } })).toBe('fuel');
  });

  it('answerPlaceHref only for a guessed drop at a known place', () => {
    expect(answerPlaceHref({ drop: { orgSiteId: 's1', source: 'INFERRED_TURNAROUND' } })).toBe(
      '/place-hub?place=site%3As1',
    );
    expect(answerPlaceHref({ drop: { orgSiteId: 's1', source: 'LABELLED_PLACE' } })).toBeNull();
    expect(answerPlaceHref({ drop: { source: 'INFERRED_TURNAROUND' } })).toBeNull();
  });
});

describe('fmtDuration / fmtKm', () => {
  it('prints hours and minutes the way the trip page reads', () => {
    expect(fmtDuration(903)).toBe('15 h 3 min');
    expect(fmtDuration(470)).toBe('7 h 50 min');
    expect(fmtDuration(120)).toBe('2 h');
    expect(fmtDuration(3)).toBe('3 min');
    expect(fmtDuration(null)).toBe('—');
  });

  it('prints whole km with Indian grouping', () => {
    expect(fmtKm(269.6)).toBe('270 km');
    expect(fmtKm(123456)).toBe('1,23,456 km');
    expect(fmtKm(null)).toBe('—');
  });
});

describe('fmtDateRange / tripDateRange', () => {
  // Midday UTC so the local date is the same in every Indian / European timezone.
  const day = (d, m) =>
    `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T06:00:00Z`;

  it('collapses a range to the shortest form', () => {
    expect(fmtDateRange(day(7, 10), day(8, 10))).toBe('7–8 Oct 2026');
    expect(fmtDateRange(day(30, 9), day(1, 10))).toBe('30 Sep – 1 Oct 2026');
    expect(fmtDateRange(day(7, 10), day(7, 10))).toBe('7 Oct 2026');
    expect(fmtDateRange(day(6, 9), null)).toBe('6 Sep 2026');
    expect(fmtDateRange(null, null)).toBe('');
  });

  it('spans plant arrival to the last drop, or says the truck is still out', () => {
    const pickup = { arrivedAt: day(7, 10), departedAt: day(7, 10) };
    expect(
      tripDateRange({
        pickup,
        drop: { arrivedAt: day(8, 10) },
        extraDrops: [{ arrivedAt: day(9, 10) }],
      }),
    ).toBe('7–9 Oct 2026');
    expect(tripDateRange({ pickup, drop: {} })).toBe('7 Oct 2026 · on the road');
  });
});

describe('stopsOnWayText', () => {
  it('names the unknown stops and the kinds that did not happen', () => {
    expect(stopsOnWayText({ fuel: 0, rest: 0, overnight: 0, unexplained: 1 })).toBe(
      '1 unknown stop · no fuel, rest or overnight stops',
    );
    expect(stopsOnWayText({ fuel: 2, rest: 1, overnight: 0, unexplained: 0 })).toBe(
      '2 fuel stops · 1 rest stop · no overnight stops',
    );
    expect(stopsOnWayText({ fuel: 1, rest: 1, overnight: 1, unexplained: 0 })).toBe(
      '1 fuel stop · 1 rest stop · 1 overnight stop',
    );
    expect(stopsOnWayText(null)).toBe('—');
  });
});

describe('stopKind', () => {
  it('takes a person’s answer over the engine’s guess', () => {
    expect(stopKind({ purpose: { top: 'UNKNOWN' }, humanReason: { purpose: 'fuel' } })).toBe(
      'FUEL',
    );
  });
  it('treats unexplained or unrecognised purposes as unknown', () => {
    expect(stopKind({ purpose: { top: 'REST', unexplained: true } })).toBe('UNKNOWN');
    expect(stopKind({ purpose: { top: 'UNEXPLAINED' } })).toBe('UNKNOWN');
    expect(stopKind({ purpose: { top: 'FUEL' } })).toBe('FUEL');
    expect(stopKind({})).toBe('UNKNOWN');
  });
});

describe('timelineRows', () => {
  const trip = {
    pickup: {
      name: 'Dalmia Salbani',
      arrivedAt: '2026-10-07T00:00:00Z',
      departedAt: '2026-10-07T15:00:00Z',
    },
    drop: { name: 'Mamudpur', arrivedAt: '2026-10-07T22:50:00Z', source: 'LABELLED_PLACE' },
    durations: { plantMin: 903 },
    routeStops: [
      {
        _id: 's1',
        startAt: '2026-10-07T15:19:00Z',
        dwellMinutes: 3,
        purpose: { top: 'UNEXPLAINED' },
        place: { name: 'Gabru Pump, Salbani' },
      },
      { _id: 's2', startAt: '2026-10-07T22:50:00Z', dwellMinutes: 151 },
      { _id: 's3', startAt: '2026-10-08T02:00:00Z', dwellMinutes: 40, purpose: { top: 'FUEL' } },
    ],
  };

  it('runs loading → stops → unloading in time order', () => {
    const rows = timelineRows(trip);
    expect(rows.map((r) => r.kind)).toEqual(['loading', 'unknown', 'drop', 'stop']);
    expect(rows[0]).toMatchObject({ place: 'Dalmia Salbani', placeNote: 'plant', stayMin: 903 });
    expect(rows[0].playAt).toBe(trip.pickup.departedAt);
    expect(rows[1]).toMatchObject({ label: 'Unknown stop', place: 'Gabru Pump, Salbani' });
    expect(rows[2]).toMatchObject({
      label: 'Unloading',
      place: 'Mamudpur',
      placeNote: 'drop place',
    });
    expect(rows[3].label).toBe('Fuel stop');
  });

  it('adds the drop when no stop sits on it', () => {
    const rows = timelineRows({ ...trip, routeStops: [] });
    expect(rows.map((r) => r.kind)).toEqual(['loading', 'drop']);
    expect(rows[1].stop).toBeNull();
  });

  it('is empty without a trip', () => {
    expect(timelineRows(null)).toEqual([]);
  });
});

describe('timelinePlan', () => {
  const trip = {
    status: 'COMPLETE',
    pickup: {
      name: 'Dalmia Salbani',
      arrivedAt: '2026-10-07T00:00:00Z',
      departedAt: '2026-10-07T15:03:00Z',
    },
    drop: {
      name: 'Mamudpur',
      arrivedAt: '2026-10-07T22:50:00Z',
      departedAt: '2026-10-08T01:21:00Z',
      source: 'LABELLED_PLACE',
    },
    durations: { plantMin: 903 },
    routeStops: [
      {
        _id: 's1',
        startAt: '2026-10-07T15:22:00Z',
        endAt: '2026-10-07T15:25:00Z',
        dwellMinutes: 3,
        purpose: { unexplained: true },
      },
      {
        _id: 's2',
        startAt: '2026-10-07T22:50:00Z',
        endAt: '2026-10-08T01:21:00Z',
        dwellMinutes: 151,
      },
    ],
  };

  it('puts a drive between each pair of steps and splits the time', () => {
    const plan = timelinePlan(trip);
    expect(plan.items.map((it) => it.kind || it.type)).toEqual([
      'loading',
      'leg',
      'unknown',
      'leg',
      'drop',
    ]);
    expect(plan.items[1]).toMatchObject({ driveMin: 19, load: 'loaded' });
    expect(plan.items[3]).toMatchObject({ driveMin: 445, load: 'loaded' });
    expect(plan.spans.map((s) => s.kind)).toEqual(['plant', 'drive', 'unknown', 'drive', 'drop']);
    expect(plan.legend).toEqual([
      { kind: 'plant', label: 'At plant', min: 903 },
      { kind: 'drive', label: 'Driving', min: 464 },
      { kind: 'unknown', label: 'Unknown stop', min: 3 },
      { kind: 'drop', label: 'Unloading', min: 151 },
    ]);
    expect(plan.totalMin).toBe(903 + 464 + 3 + 151);
    expect(plan.totalOf).toBe('plant arrival to drop departure');
  });

  it('drives after the last drop are empty', () => {
    const later = {
      ...trip,
      routeStops: [
        ...trip.routeStops,
        {
          _id: 's3',
          startAt: '2026-10-08T03:00:00Z',
          endAt: '2026-10-08T03:40:00Z',
          dwellMinutes: 40,
          purpose: { top: 'FUEL' },
        },
      ],
    };
    const plan = timelinePlan(later);
    expect(plan.items[5]).toMatchObject({ type: 'leg', driveMin: 99, load: 'empty' });
    expect(plan.legend.find((l) => l.kind === 'stop')).toMatchObject({ min: 40 });
    expect(plan.totalOf).toBe('plant arrival to last stop departure');
  });

  it('leaves the drive blank when the last departure is unknown', () => {
    const plan = timelinePlan({ ...trip, pickup: { ...trip.pickup, departedAt: null } });
    expect(plan.items[1]).toMatchObject({ type: 'leg', driveMin: null });
  });

  it('is empty without a trip', () => {
    expect(timelinePlan(null)).toMatchObject({ items: [], spans: [], legend: [], totalMin: 0 });
  });
});

describe('fmtDay', () => {
  it('prints the day and month', () => {
    expect(fmtDay(new Date(2026, 9, 7, 20, 30))).toBe('7 Oct');
    expect(fmtDay(null)).toBe('—');
  });
});

describe('inWindow / notReachedYet', () => {
  const track = { from: '2026-10-07T15:00:00Z', to: '2026-10-07T22:50:00Z' };
  it('allows play only inside the replay window', () => {
    expect(inWindow('2026-10-07T15:00:00Z', track)).toBe(true);
    expect(inWindow('2026-10-07T22:50:00Z', track)).toBe(true);
    expect(inWindow('2026-10-08T02:00:00Z', track)).toBe(false);
    expect(inWindow('2026-10-07T16:00:00Z', null)).toBe(false);
  });
  it('flags an open trip that has not reached a drop', () => {
    expect(notReachedYet({ status: 'OPEN', drop: {} })).toBe(true);
    expect(notReachedYet({ status: 'OPEN', drop: { arrivedAt: '2026-10-07T22:50:00Z' } })).toBe(
      false,
    );
    expect(notReachedYet({ status: 'COMPLETE', drop: {} })).toBe(false);
  });
});

describe('tripRoadLayers / tripRoadAt: the trip replay draws the road our engine matched', () => {
  const T0 = Date.UTC(2026, 9, 7, 0, 7, 26);
  const A = { lat: 25.6066864, lng: 84.287424 };
  const M = { lat: 25.59, lng: 84.22 };
  const B = { lat: 25.5796912, lng: 84.1612288 };
  const trail = {
    mode: 'MATCHED',
    segments: [
      // the frozen-GPS gap of WB11N2762 on 7 Oct, drawn on the road
      { kind: 'INFERRED', t0: T0, t1: T0 + 600e3, distM: 15350, geom: encodePolyline6([A, M, B]) },
    ],
  };

  it('no road trail, or raw only: null (the replay keeps its GPS line)', () => {
    expect(tripRoadLayers(null)).toBeNull();
    expect(tripRoadLayers({ mode: 'RAW_ONLY', segments: [] })).toBeNull();
  });

  it('the whole road, the part driven so far, and the truck on the road', () => {
    const full = tripRoadLayers(trail);
    expect(full).toHaveLength(1);
    expect(full[0].path).toHaveLength(3);
    const r = tripRoadAt(full, T0 + 300e3);
    expect(r.run).toHaveLength(1);
    expect(r.run[0].path.length).toBeGreaterThanOrEqual(2);
    // halfway in time is on the road between A and B, not on the straight chord
    expect(r.truckAt.lng).toBeLessThan(A.lng);
    expect(r.truckAt.lng).toBeGreaterThan(B.lng);
  });
});
