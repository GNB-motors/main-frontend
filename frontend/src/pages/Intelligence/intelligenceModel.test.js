import { describe, it, expect } from 'vitest';
import {
  INSTANCE_EMPTY_COPY,
  groupIssuesByKind,
  humanizeDates,
  isTemplatedText,
  placeCategoryLabel,
  whenText,
  ISSUE_GROUPS,
  PERIOD_PRESETS,
  bucketReportCards,
  classifyTrip,
  issueCounts,
  issuesInGroup,
  periodDates,
  periodRangeLabel,
  resolvePeriod,
  shiftYmd,
  sortIssues,
  summarisePlacesByPlace,
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

describe('the issue groups', () => {
  const silent = (id, reg, days, severity = 'act') => ({
    id,
    kind: 'NO_DATA',
    severity,
    registrationNumber: reg,
    detail: `No reading for ${days} days, while the account is healthy.`,
    advice: 'Check the tracker.',
    firstSeenAt: `2026-10-${String(30 - days).padStart(2, '0')}T05:00:00Z`,
    lastSeenAt: '2026-11-03T23:40:00Z',
    occurrences: 1,
  });
  const lamp = {
    id: 'l1',
    kind: 'WARNING_LAMP',
    severity: 'watch',
    registrationNumber: 'WB11S1862',
    detail: 'The engine (MIL) lamp stayed on across 1358 readings over 10004 minutes.',
    advice: 'Get it scanned.',
    firstSeenAt: '2026-10-28T00:54:02Z',
    lastSeenAt: '2026-11-03T23:38:18Z',
    occurrences: 1358,
  };

  it('makes one group per kind, what needs the owner first', () => {
    const groups = groupIssuesByKind([lamp, silent('a', 'A', 4), silent('b', 'B', 27)]);
    expect(groups.map((group) => group.kind)).toEqual(['NO_DATA', 'WARNING_LAMP']);
    expect(groups[0].countLabel).toBe('2 trucks');
    expect(groups[0].range).toBe('silent for 4–27 days');
    expect(groups[0].advice).toBe('Check the tracker.');
    // The longest-silent truck first.
    expect(groups[0].items.map((issue) => issue.id)).toEqual(['b', 'a']);
  });

  it('reads the numbers of each kind from the issue', () => {
    const [group] = groupIssuesByKind([lamp]);
    const read = Object.fromEntries(group.columns.map((col) => [col.label, col.read(lamp)]));
    expect(read).toEqual({ Lamp: 'Engine (MIL)', 'On for': '6 d 22 h', Readings: '1358' });
  });

  it('shows a dash rather than a guess when a number cannot be read', () => {
    const [group] = groupIssuesByKind([{ ...lamp, detail: 'Something else.' }]);
    expect(group.columns[0].read({ detail: 'Something else.' })).toBeNull();
  });

  it('drops the shared advice when the trucks were told different things', () => {
    const [group] = groupIssuesByKind([silent('a', 'A', 4), { ...silent('b', 'B', 5), advice: 'Other.' }]);
    expect(group.advice).toBeNull();
  });

  it('marks a group whose issues are not all the same tone', () => {
    const [group] = groupIssuesByKind([silent('a', 'A', 4), silent('b', 'B', 5, 'watch')]);
    expect(group.severity).toBe('act');
    expect(group.mixedSeverity).toBe(true);
  });
});

describe('the words of a moment', () => {
  it('shows a window that starts at IST midnight as a day, not 12:00 am', () => {
    expect(whenText('2026-10-27T18:30:00.000Z', '2026-11-04T12:11:19.920Z')).toBe(
      '28 Oct → 4 Nov, 5:41 pm',
    );
  });

  it('shows a window inside one day as a time range', () => {
    expect(whenText('2026-10-29T00:40:33.000Z', '2026-10-29T01:05:33.000Z')).toBe(
      '29 Oct, 6:10 am – 6:35 am',
    );
  });

  it('shows a moment without an end as its time', () => {
    expect(whenText('2026-10-29T00:40:33.000Z')).toBe('29 Oct, 6:10 am');
  });

  it('turns raw dates inside an API sentence into words', () => {
    expect(humanizeDates('2026-10-27 → 2026-11-03')).toBe('27 Oct → 3 Nov');
    expect(humanizeDates('First seen 2026-10-27T02:20:13.000Z')).toBe('First seen 27 Oct, 7:50 am');
  });

  it('spots a sentence that only repeats the row number', () => {
    expect(isTemplatedText(['87.0 L left the tank', '104.8 L left the tank'])).toBe(true);
    expect(isTemplatedText(['Idled at a dhaba', 'Left the usual road'])).toBe(false);
    expect(isTemplatedText(['Only one row 1'])).toBe(false);
  });

  it('names a place category in words and never prints UNKNOWN', () => {
    expect(placeCategoryLabel('FUEL_PUMP')).toBe('Fuel pump');
    expect(placeCategoryLabel('UNKNOWN')).toBeNull();
    expect(placeCategoryLabel(null)).toBeNull();
  });
});
