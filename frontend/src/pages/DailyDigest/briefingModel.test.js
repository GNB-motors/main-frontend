import { describe, it, expect } from 'vitest';
import {
  attentionGroups,
  buildKpis,
  exceptionSummary,
  feedReason,
  formatSilence,
  leakRows,
  sectionsById,
} from './briefingModel';

const NOW = new Date('2026-11-04T12:00:00Z').getTime();
const H = 3600 * 1000;

const sections = sectionsById([
  { id: 'fleetNow', numbers: { moving: 27, dark: 49 } },
  { id: 'yesterdaysWork', numbers: { trips: 0, km: 0 } },
  {
    id: 'trend',
    numbers: { tripsPrev7Avg: 31.6, kmPrev7Avg: 7952.7, tripsVsPrev7Pct: 12.5, kmVsPrev7Pct: -4 },
  },
  {
    id: 'dataHealth',
    numbers: { trucks: 126, trucksDark: 49 },
    rows: {
      trucksNoData: ['WB11E5862', 'WB11E5562'],
      failingFeeds: [
        {
          consecutiveFailedPulls: 5,
          lastFailureReason:
            'FleetEdge /api/wrapper-service/track/get-vehicle-status-details timed out after 30s',
        },
      ],
    },
    sources: [{ name: 'AccountFeedHealth (vendor feeds)', freshAsOf: '2026-09-22T12:01:00.605Z' }],
  },
  {
    id: 'exceptions',
    numbers: { total: 1257 },
    rows: [
      { kind: 'sos', count: 0, rows: [] },
      { kind: 'moneyTheft', count: 15, rows: [] },
      { kind: 'idling', count: 844, numbers: { verifiedIdleMinutes: 5601 }, rows: [] },
      {
        kind: 'stuckAtPlant',
        count: 1,
        rows: [{ registrationNumber: 'WB11T0662', stationaryMinutes: 210 }],
      },
      { kind: 'etaSlipping', count: null, note: 'not built yet' },
    ],
  },
]);

describe('buildKpis', () => {
  it('uses the Trips summary including open/review trips and labels partial loaded distance', () => {
    const tiles = buildKpis({
      byId: {
        yesterdaysWork: {
          numbers: { trips: 9, km: 325, openTrips: 4, reviewTrips: 2, kmPartial: true },
        },
      },
      isToday: true,
    });
    const by = Object.fromEntries(tiles.map((tile) => [tile.key, tile]));
    expect(by.trips.value).toBe(9);
    expect(by.trips.context).toBe('Departed today · includes open trips');
    expect(by.km.value).toBe(325);
    expect(by.km.context).toBe('Loaded trip distance · partial');
    expect(by.km.why).toContain('odometer first');
  });

  it('uses live counts for "now" and preserves reported zero trips and km today', () => {
    const tiles = buildKpis({
      byId: sections,
      brief: { totalRupees: 47486.7, sections: [{}, {}], disclaimer: 'Estimated.' },
      isToday: true,
      liveCounts: { all: 124, moving: 9, offline: 47 },
      builtAt: '6:20 am',
    });
    const by = Object.fromEntries(tiles.map((t) => [t.key, t]));
    expect(by.moving.value).toBe(9);
    expect(by.moving.context).toBe('of 124 trucks · live');
    expect(by.trips.value).toBe(0);
    expect(by.trips.context).toBe('Completed / confirmed · so far today');
    expect(by.km.value).toBe(0);
    expect(by.km.context).toBe('From completed / confirmed trips');
    expect(by.trips.delta).toBeNull();
    expect(by.km.delta).toBeNull();
    expect(by.trips.why).toMatch(/Open trips are excluded/);
    expect(by.trips.why).toMatch(/built at 6:20 am/);
    expect(by.lost.value).toBe(47486.7);
    expect(by.lost.context).toBe('Estimated across 2 problems');
    expect(by.lost.why).toBe('Estimated.');
    expect(by.dark.value).toBe(47);
  });

  it('keeps missing counts unknown instead of inventing zeros or using the previous average', () => {
    const tiles = buildKpis({
      byId: { ...sections, yesterdaysWork: { numbers: { trips: null, km: null } } },
      isToday: true,
    });
    const by = Object.fromEntries(tiles.map((t) => [t.key, t]));
    expect(by.trips.value).toBeNull();
    expect(by.km.value).toBeNull();
    expect(by.trips.context).toBe('Not counted yet · usually 32/day');
    expect(by.km.context).toBe('Not counted yet · usually 7,953 km');
  });

  it('falls back to the report snapshot, with deltas, on a past day', () => {
    const past = sectionsById([
      ...Object.values(sections).filter((s) => s.id !== 'yesterdaysWork'),
      { id: 'yesterdaysWork', numbers: { trips: 36, km: 7600 } },
    ]);
    const tiles = buildKpis({
      byId: past,
      brief: null,
      isToday: false,
      liveCounts: { all: 124, moving: 9, offline: 47 },
      builtAt: '3 Nov, 6:20 am',
    });
    const by = Object.fromEntries(tiles.map((t) => [t.key, t]));
    expect(by.moving.label).toBe('Moving');
    expect(by.moving.value).toBe(27);
    expect(by.moving.context).toBe('When the report ran, 3 Nov, 6:20 am');
    expect(by.trips.value).toBe(36);
    expect(by.trips.delta).toBe(12.5);
    expect(by.km.delta).toBe(-4);
    expect(by.lost.value).toBeNull();
    expect(by.dark.value).toBe(49);
  });
});

describe('leakRows', () => {
  it('ranks the leaks, gives each its share, and describes each truck', () => {
    const rows = leakRows({
      sections: [
        {
          key: 'excessIdling',
          label: 'Excess idling',
          rupees: 5665.8,
          vehicles: [{ registrationNumber: 'WB11M2262', rupees: 342, durationMin: 3027.72 }],
        },
        {
          key: 'fuelOverModel',
          label: 'Fuel over expected',
          rupees: 41820.9,
          vehicles: [
            { registrationNumber: 'WB11S3862', rupees: 2215.4, excessL: 23.32 },
            { registrationNumber: 'WB11S4062', rupees: 2950.7, excessL: 31.06 },
          ],
        },
      ],
    });
    expect(rows.map((r) => r.key)).toEqual(['fuelOverModel', 'excessIdling']);
    expect(Math.round(rows[0].share * 100)).toBe(88);
    expect(rows[0].trucks[0]).toEqual({ reg: 'WB11S4062', rupees: 2950.7, detail: '31.1 L over' });
    expect(rows[1].trucks[0].detail).toBe('2 d idle');
  });
});

describe('exceptionSummary', () => {
  it('bars the counted kinds and names the clear and unmeasured ones', () => {
    const summary = exceptionSummary(sections.exceptions);
    expect(summary.counted.map((r) => r.key)).toEqual(['idling', 'moneyTheft', 'stuckAtPlant']);
    expect(summary.counted[0].detail).toBe('93 h engine on');
    expect(summary.counted[1].urgent).toBe(true);
    expect(summary.clear).toEqual(['SOS']);
    expect(summary.unmeasured).toEqual(['ETA slipping']);
    expect(summary.total).toBe(1257);
  });
});

describe('attentionGroups', () => {
  it('groups dark trucks most-recently-dark first, plus stuck, no-data and failing feeds', () => {
    const groups = attentionGroups({
      vehicles: [
        { plate: 'WB11A1', status: 'offline', lastFixAt: new Date(NOW - 3 * H).toISOString() },
        {
          plate: 'WB11A2',
          status: 'offline',
          lastFixAt: new Date(NOW - 30 * 24 * H).toISOString(),
        },
        { plate: 'WB11A3', status: 'moving', lastFixAt: new Date(NOW).toISOString() },
      ],
      byId: sections,
      now: NOW,
    });
    expect(groups.dark.map((d) => d.reg)).toEqual(['WB11A1', 'WB11A2']);
    expect(groups.darkRange).toBe('3 h to 30 d');
    expect(groups.stuck).toEqual([{ reg: 'WB11T0662', silent: '4 h' }]);
    expect(groups.neverReported.map((t) => t.reg)).toEqual(['WB11E5862', 'WB11E5562']);
    expect(groups.feeds[0].reason).toBe("The vendor's server timed out after 30 s");
    expect(groups.feeds[0].lastSuccess).toBe('22 Sept');
  });
});

describe('small formatters', () => {
  it('writes silence the way a person says it', () => {
    expect(formatSilence(20 * 60000)).toBe('20 min');
    expect(formatSilence(5 * H)).toBe('5 h');
    expect(formatSilence(36 * 24 * H)).toBe('36 d');
    expect(formatSilence(1886 * 24 * H)).toBe('5 yr+');
    expect(formatSilence(null)).toBeNull();
  });

  it('strips internal API paths from a vendor error', () => {
    expect(feedReason('auth failed at /api/x/y')).toBe('Auth failed at');
    expect(feedReason(null)).toBeNull();
  });
});
