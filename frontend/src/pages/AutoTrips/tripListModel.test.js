import { describe, expect, it } from 'vitest';
import {
  allUnknown,
  actualTripCount,
  deliveredTripCount,
  destinationOf,
  median,
  minutesOnRoad,
  needReasons,
  placeQueue,
  shareText,
  shortDuration,
  titleCasePlace,
  typicalRun,
} from './tripListModel';

it('confirmation preserves delivered counts and rejected detections never enter actual totals', () => {
  expect(deliveredTripCount({ COMPLETE: 100, CONFIRMED: 0 })).toBe(100);
  expect(deliveredTripCount({ COMPLETE: 40, CONFIRMED: 60 })).toBe(100);
  const counts = {
    COMPLETE: 40,
    CONFIRMED: 20,
    OPEN: 20,
    NEEDS_REVIEW: 0,
    DISMISSED: 20,
    SUPERSEDED: 30,
    PLANNED: 50,
    DELIVERED: 60,
    reposition: 10,
  };
  expect(actualTripCount(counts)).toBe(80);
  expect(shareText(deliveredTripCount(counts), actualTripCount(counts))).toBe('75%');
  expect(actualTripCount({ DISMISSED: 20 })).toBe(0);
  expect(actualTripCount()).toBe(0);
});

describe('titleCasePlace', () => {
  it('title-cases a name written in capitals and keeps short codes', () => {
    expect(titleCasePlace('AMBUJA DHULAGOR')).toBe('Ambuja Dhulagor');
    expect(titleCasePlace('JK BUXAR')).toBe('JK Buxar');
    expect(titleCasePlace('DALMIA OCL')).toBe('Dalmia OCL');
    expect(titleCasePlace('AMBUJA PLANT SANKRAIL')).toBe('Ambuja Plant Sankrail');
  });

  it('leaves a name a person typed in mixed case alone', () => {
    expect(titleCasePlace('UltraTech Cement Hooghly Cement Plant')).toBe(
      'UltraTech Cement Hooghly Cement Plant',
    );
    expect(titleCasePlace(null)).toBe('');
  });
});

describe('destinationOf', () => {
  it('says a truck still out is on the way', () => {
    expect(destinationOf({ status: 'OPEN', drop: { source: 'UNKNOWN' } })).toMatchObject({
      text: 'on the way',
      state: 'moving',
    });
  });

  it('says plainly when no drop was found', () => {
    expect(
      destinationOf({
        status: 'NEEDS_REVIEW',
        flags: ['DROP_UNKNOWN'],
        drop: { source: 'UNKNOWN' },
      }),
    ).toMatchObject({ text: 'drop not found', state: 'missing' });
  });

  it('marks an inferred drop and keeps the original spelling for the tooltip', () => {
    expect(
      destinationOf({
        status: 'NEEDS_REVIEW',
        flags: ['DROP_INFERRED'],
        drop: { name: 'NIMPURA', source: 'INFERRED_TURNAROUND', arrivedAt: '2026-11-03T02:40:00Z' },
      }),
    ).toEqual({ text: 'Nimpura (inferred)', title: 'NIMPURA', state: 'guessed' });
  });

  it('asks for an answer when an inferred drop has no name', () => {
    expect(
      destinationOf({
        status: 'NEEDS_REVIEW',
        flags: ['DROP_INFERRED'],
        drop: { name: null, source: 'INFERRED_TURNAROUND', arrivedAt: '2026-11-03T02:40:00Z' },
      }),
    ).toEqual({ text: 'inferred, needs your answer', title: null, state: 'guessed' });
  });

  it('names a reached drop, or says it has no name', () => {
    const reached = {
      status: 'COMPLETE',
      drop: { name: 'NIMPURA', source: 'LABELLED_PLACE', arrivedAt: 'x' },
    };
    expect(destinationOf(reached)).toEqual({ text: 'Nimpura', title: 'NIMPURA', state: 'reached' });
    const unnamed = {
      status: 'COMPLETE',
      drop: { name: null, source: 'LABELLED_PLACE', arrivedAt: 'x' },
    };
    expect(destinationOf(unnamed)).toMatchObject({ text: 'unnamed drop place', state: 'unnamed' });
  });
});

describe('row numbers', () => {
  it('counts the time since an open trip left the plant', () => {
    const now = new Date('2026-11-04T12:00:00Z');
    expect(
      minutesOnRoad({ status: 'OPEN', pickup: { departedAt: '2026-11-04T10:30:00Z' } }, now),
    ).toBe(90);
    expect(minutesOnRoad({ status: 'COMPLETE', pickup: { departedAt: 'x' } }, now)).toBeNull();
  });

  it('keeps a duration short enough for a cell', () => {
    expect(shortDuration(45)).toBe('45 min');
    expect(shortDuration(181)).toBe('3 h 1 min');
    expect(shortDuration(14 * 60 + 22)).toBe('14 h');
    expect(shortDuration(3 * 24 * 60 + 5 * 60)).toBe('3 d 5 h');
    expect(shortDuration(null)).toBeNull();
  });

  it('only calls a column unknown when every row lacks it', () => {
    expect(allUnknown([{ a: null }, { a: 1 }], (r) => r.a)).toBe(false);
    expect(allUnknown([{ a: null }, {}], (r) => r.a ?? null)).toBe(true);
    expect(allUnknown([], (r) => r.a)).toBe(false);
  });
});

describe('KPI strip', () => {
  it('takes the median, odd or even', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it('measures the typical run on the odometer first, then the GPS path', () => {
    const rows = [100, 110, 120, 130, 140].map((km, i) => ({
      km: i === 0 ? { laden: 999, ladenOdo: km } : { laden: km },
      durations: { ladenMin: km * 2 },
    }));
    expect(typicalRun(rows)).toEqual({ km: 120, min: 240, sample: 5, measured: 5 });
  });

  it('refuses a typical run from too few trips', () => {
    expect(typicalRun([{ km: { laden: 50 } }]).km).toBeNull();
  });

  it('writes a share, never 0% for a non-zero part', () => {
    expect(shareText(585, 2935)).toBe('20%');
    expect(shareText(1, 2935)).toBe('<1%');
    expect(shareText(5, 0)).toBeNull();
  });
});

describe('needs your answer', () => {
  it('counts each waiting trip once, under its first reason', () => {
    const reasons = needReasons([
      { flags: ['DROP_UNKNOWN'] },
      { flags: ['DROP_UNKNOWN', 'GPS_GAP'] },
      { flags: ['DROP_INFERRED'] },
      { flags: ['SHORT_HAUL'] },
    ]);
    expect(reasons.map((r) => [r.key, r.count])).toEqual([
      ['DROP_UNKNOWN', 2],
      ['DROP_INFERRED', 1],
      ['OTHER', 1],
    ]);
  });

  it('adds up what naming the waiting places settles', () => {
    const queue = placeQueue([{ tripsAffected: 2 }, { tripsAffected: 8 }, { tripsAffected: 5 }], 2);
    expect(queue).toEqual({ places: 3, trips: 15, top: 2, topTrips: 13 });
  });
});

describe('destinationOf for a trip that stayed open', () => {
  it('calls a stale trip stale, not on its way', () => {
    const trip = { status: 'OPEN', flags: ['STALE_OPEN'], drop: { source: 'UNKNOWN' } };
    expect(destinationOf(trip)).toEqual({
      text: 'stale, no drop yet',
      title: null,
      state: 'missing',
    });
  });

  it('keeps saying “on the way” for a trip that is still running', () => {
    expect(destinationOf({ status: 'OPEN', flags: [] }).text).toBe('on the way');
  });
});

describe('destinationOf for a multi-drop loaded run', () => {
  it('uses the final drop as the destination of a multi-drop loaded run', () => {
    expect(
      destinationOf({
        status: 'COMPLETE',
        drop: { name: 'PATNA', source: 'LABELLED_PLACE' },
        extraDrops: [{ name: 'NIYAJIPUR' }, { name: 'MASHWRHI' }],
      }),
    ).toMatchObject({
      text: 'Mashwrhi',
      title: 'MASHWRHI',
      state: 'reached',
    });
  });

  it('keeps an unnamed final drop unnamed instead of substituting the first stop', () => {
    expect(
      destinationOf({ status: 'COMPLETE', drop: { name: 'PATNA' }, extraDrops: [{ name: null }] }),
    ).toMatchObject({ state: 'unnamed' });
  });
});
