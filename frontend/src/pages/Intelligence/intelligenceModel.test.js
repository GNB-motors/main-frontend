import { describe, it, expect } from 'vitest';
import {
  INSTANCE_EMPTY_COPY,
  ISSUE_GROUPS,
  PERIOD_PRESETS,
  bucketReportCards,
  classifyTrip,
  issueCounts,
  issuesInGroup,
  periodDates,
  periodRangeLabel,
  resolvePeriod,
  runBarsByTruck,
  shiftYmd,
  sortIssues,
  summarisePlacesByPlace,
  tripKmParts,
} from './intelligenceModel';

// 2 Nov 2026, 15:30 IST — a fixed "now" so the windows never move.
const NOW = new Date('2026-11-02T10:00:00Z');

describe('resolvePeriod', () => {
  it('defaults to the last 7 days', () => {
    const period = resolvePeriod({}, NOW);
    expect(period.preset).toBe('7d');
    expect(period.from).toBe('2026-10-27');
    expect(period.to).toBe('2026-11-02');
    expect(period.label).toBe('Last 7 days');
  });

  it('reads a preset back from the dates in the URL', () => {
    const period = resolvePeriod({ from: '2026-10-04', to: '2026-11-02' }, NOW);
    expect(period.preset).toBe('30d');
    expect(period.label).toBe('Last 30 days');
  });

  it('reads this month back from the dates in the URL', () => {
    const period = resolvePeriod({ from: '2026-11-01', to: '2026-11-02' }, NOW);
    expect(period.preset).toBe('month');
  });

  it('treats any other pair of dates as a custom period', () => {
    const period = resolvePeriod({ from: '2026-09-01', to: '2026-09-30' }, NOW);
    expect(period.preset).toBe('custom');
    expect(period.label).toBe('1 Sep – 30 Sep');
  });

  it('falls back to 7 days when the dates make no sense', () => {
    const period = resolvePeriod({ from: '2026-11-02', to: '2026-10-01' }, NOW);
    expect(period.preset).toBe('7d');
    expect(period.from).toBe('2026-10-27');
  });

  it('ignores a broken date', () => {
    expect(resolvePeriod({ from: 'yesterday', to: 'today' }, NOW).preset).toBe('7d');
  });
});

describe('periodDates', () => {
  it('gives the days of the month preset', () => {
    expect(periodDates('month', NOW)).toEqual({ from: '2026-11-01', to: '2026-11-02' });
  });

  it('gives the days of the 30 days preset', () => {
    expect(periodDates('30d', NOW)).toEqual({ from: '2026-10-04', to: '2026-11-02' });
  });
});

describe('shiftYmd', () => {
  it('moves a day across a month end', () => {
    expect(shiftYmd('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftYmd('2026-11-01', -1)).toBe('2026-10-31');
  });
});

describe('periodRangeLabel', () => {
  it('shows the year when the range leaves this year', () => {
    expect(periodRangeLabel('2025-12-28', '2026-01-04', NOW)).toBe('28 Dec 2025 – 4 Jan 2026');
  });
});

describe('sortIssues', () => {
  const issues = [
    { id: 'a', kind: 'GPS_FROZEN', severity: 'watch', lastSeenAt: '2026-11-01' },
    { id: 'b', kind: 'ACCOUNT_DISCONNECTED', severity: 'act', lastSeenAt: '2026-10-30' },
    { id: 'c', kind: 'BATTERY', severity: 'act', lastSeenAt: '2026-11-02' },
  ];

  it('pins an account issue to the top', () => {
    expect(sortIssues(issues)[0].id).toBe('b');
  });

  it('then puts the tone in order', () => {
    expect(sortIssues(issues).map((issue) => issue.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('issueCounts', () => {
  const issues = [
    { kind: 'GPS_FROZEN', severity: 'watch' },
    { kind: 'GPS_JUMPS', severity: 'act' },
    { kind: 'ACCOUNT_DISCONNECTED', severity: 'act' },
  ];

  it('counts every chip', () => {
    const counts = issueCounts(issues);
    expect(counts.all).toBe(3);
    expect(counts.act).toBe(2);
    expect(counts.watch).toBe(1);
    expect(counts.groups.gps).toBe(2);
    expect(counts.groups.account).toBe(1);
  });
});

describe('issuesInGroup', () => {
  it('keeps only the kinds of the group', () => {
    const issues = [
      { id: 'a', kind: 'GPS_FROZEN', severity: 'watch' },
      { id: 'b', kind: 'BATTERY', severity: 'act' },
    ];
    expect(issuesInGroup(issues, 'gps').map((issue) => issue.id)).toEqual(['a']);
    expect(issuesInGroup(issues, 'battery_coolant').map((issue) => issue.id)).toEqual(['b']);
  });

  it('gives nothing for a group that does not exist', () => {
    expect(issuesInGroup([], 'nope')).toEqual([]);
  });
});

describe('bucketReportCards', () => {
  const cards = [
    { id: 'v1', name: 'WB11L8862', grade: 'EXCELLENT', make: 'Tata' },
    { id: 'v2', name: 'WB11F6762', grade: 'GOOD', make: 'Tata' },
    { id: 'v3', name: 'WB11A1111', grade: 'FAIR', make: 'Ashok Leyland' },
    { id: 'v4', name: 'WB11B2222', grade: 'FALLING', make: 'Tata' },
  ];

  it('puts every grade in its own column', () => {
    const { buckets } = bucketReportCards(cards);
    expect(buckets.map((bucket) => bucket.id)).toEqual([
      'excellent',
      'good',
      'fair',
      'falling',
      'ungraded',
    ]);
    expect(buckets[0].cards.map((card) => card.id)).toEqual(['v1']);
    expect(buckets[3].cards.map((card) => card.id)).toEqual(['v4']);
  });

  it('keeps trucks without enough data visible', () => {
    const { buckets, total } = bucketReportCards([{ id: 'unknown', grade: 'NOT_ENOUGH_DATA' }]);
    expect(total).toBe(1);
    expect(buckets[4].cards[0].id).toBe('unknown');
  });

  it('filters by grade', () => {
    const { buckets } = bucketReportCards(cards, { grade: 'GOOD' });
    expect(buckets.flatMap((bucket) => bucket.cards).map((card) => card.id)).toEqual(['v2']);
  });

  it('searches by plate', () => {
    const { buckets } = bucketReportCards(cards, { query: 'WB11A' });
    expect(buckets.flatMap((bucket) => bucket.cards).map((card) => card.id)).toEqual(['v3']);
  });

  it('filters by make', () => {
    const { buckets } = bucketReportCards(cards, { make: 'Ashok Leyland' });
    expect(buckets.flatMap((bucket) => bucket.cards).map((card) => card.id)).toEqual(['v3']);
  });
});

describe('classifyTrip', () => {
  it('trusts the leg the API sends', () => {
    expect(classifyTrip({ leg: 'REPOSITION' })).toBe('reposition');
    expect(classifyTrip({ leg: 'LADEN' })).toBe('loaded');
    expect(classifyTrip({ leg: 'RETURN' })).toBe('empty');
  });

  it('falls back to the plant-to-plant flag', () => {
    expect(classifyTrip({ flags: ['PICKUP_TO_PICKUP'] })).toBe('reposition');
  });

  it('reads a delivery as loaded and a run without a drop as empty', () => {
    expect(classifyTrip({ drop: { name: 'OCL' } })).toBe('loaded');
    expect(classifyTrip({})).toBe('empty');
  });
});

describe('tripKmParts', () => {
  it('never counts a plant-to-plant run as empty', () => {
    const parts = tripKmParts({ flags: ['PICKUP_TO_PICKUP'], km: { laden: 300, return: 280 } });
    expect(parts).toEqual({ loadedKm: 0, emptyKm: 280, repositionKm: 300 });
  });

  it('splits a loaded trip into loaded and empty km', () => {
    const parts = tripKmParts({ drop: { name: 'OCL' }, km: { laden: 420, return: 400 } });
    expect(parts).toEqual({ loadedKm: 420, emptyKm: 400, repositionKm: 0 });
  });

  it('reads a missing km as no km at all', () => {
    expect(tripKmParts({})).toEqual({ loadedKm: 0, emptyKm: 0, repositionKm: 0 });
  });
});

describe('runBarsByTruck', () => {
  const trips = [
    { registrationNumber: 'WB11L8862', drop: { name: 'OCL' }, km: { laden: 100, return: 90 } },
    { registrationNumber: 'WB11L8862', leg: 'REPOSITION', km: { laden: 50, return: 40 } },
    { registrationNumber: 'WB11F6762', leg: 'RETURN', km: { laden: 0, return: 30 } },
  ];

  it('adds up the km of each truck', () => {
    const bars = runBarsByTruck(trips);
    expect(bars[0].registrationNumber).toBe('WB11L8862');
    expect(bars[0]).toMatchObject({ loadedKm: 100, emptyKm: 130, repositionKm: 50, totalKm: 280 });
  });

  it('keeps only the top trucks', () => {
    expect(runBarsByTruck(trips, { limit: 1 })).toHaveLength(1);
  });
});

describe('summarisePlacesByPlace', () => {
  it('counts the visits, the trucks and the usual time there', () => {
    const countsByPlace = [{ place: { id: 'poi-1', name: 'OCL Buxar' }, visits: 14 }];
    const items = [
      { registrationNumber: 'WB11L8862', place: { id: 'poi-1', name: 'OCL Buxar' }, dwellMin: 40 },
      { registrationNumber: 'WB11F6762', place: { id: 'poi-1', name: 'OCL Buxar' }, dwellMin: 60 },
    ];
    const [row] = summarisePlacesByPlace(countsByPlace, items);
    expect(row.visits).toBe(14);
    expect(row.trucks).toBe(2);
    expect(row.usualMin).toBe(60);
  });

  it('says nothing when there are no visits to learn from', () => {
    const [row] = summarisePlacesByPlace([{ place: { id: 'poi-1', name: 'OCL' }, visits: 3 }], []);
    expect(row.trucks).toBeNull();
    expect(row.usualMin).toBeNull();
  });
});

describe('the copy tables', () => {
  it('has an empty sentence for every kind of instance', () => {
    ['idle', 'overspeed', 'detour', 'fuel_unexplained', 'cruise', 'gear'].forEach((kind) => {
      expect(INSTANCE_EMPTY_COPY[kind]).toBeTruthy();
    });
  });

  it('keeps every issue kind inside a group', () => {
    const kinds = ISSUE_GROUPS.flatMap((group) => group.kinds);
    expect(new Set(kinds).size).toBe(kinds.length);
    expect(kinds).toContain('ACCOUNT_DISCONNECTED');
  });

  it('offers the three periods the spec asks for', () => {
    expect(PERIOD_PRESETS.map((preset) => preset.id)).toEqual(['7d', '30d', 'month', 'custom']);
  });
});
