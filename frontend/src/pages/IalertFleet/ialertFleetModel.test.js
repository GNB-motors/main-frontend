import { describe, it, expect } from 'vitest';
import {
  connectionNotice,
  exportRows,
  filterVehicles,
  formatDuration,
  newestPull,
  sortVehicles,
  statusChips,
  statusFor,
  statusKey,
} from './ialertFleetModel.js';

const NOW = Date.parse('2026-10-21T10:00:00Z');
const minsAgo = (m) => new Date(NOW - m * 60000).toISOString();

const v = (registration, live, extra = {}) => ({
  vin: `VIN-${registration}`,
  registration,
  type: 'EDC',
  isBs6: true,
  live,
  ...extra,
});

const moving = v('ZZ00ZZ0001', {
  status: 'RUNNING',
  lastUpdateAt: minsAgo(2),
  statusSince: minsAgo(45),
  pulledAt: minsAgo(1),
});
const stopped = v('ZZ00ZZ0002', {
  status: 'STOPPED',
  lastUpdateAt: minsAgo(30),
  statusSince: minsAgo(670),
  pulledAt: minsAgo(3),
});
const staleMoving = v('ZZ00ZZ0003', { status: 'RUNNING', lastUpdateAt: minsAgo(60 * 30) });
const noData = v('ZZ00ZZ0004', null);

describe('statusKey', () => {
  it('uses iALERT status while the reading is recent', () => {
    expect(statusKey(moving, NOW)).toBe('RUNNING');
    expect(statusKey(stopped, NOW)).toBe('STOPPED');
  });
  it('files an old reading as not reporting, whatever it said', () => {
    expect(statusKey(staleMoving, NOW)).toBe('NOT_REPORTING');
  });
  it('files a vehicle without a reading as waiting for data', () => {
    expect(statusKey(noData, NOW)).toBe('NO_DATA');
  });
});

describe('formatDuration / statusFor', () => {
  it('reads like a person would say it', () => {
    expect(formatDuration(30 * 1000)).toBe('under a minute');
    expect(formatDuration(45 * 60000)).toBe('45m');
    expect(formatDuration((11 * 60 + 10) * 60000)).toBe('11h 10m');
    expect(formatDuration(3 * 3600000)).toBe('3h');
    expect(formatDuration((2 * 24 + 3) * 3600000)).toBe('2d 3h');
    expect(formatDuration(-1)).toBeNull();
  });
  it('measures from statusSince', () => {
    expect(statusFor(stopped, NOW)).toBe('11h 10m');
    expect(statusFor(noData, NOW)).toBeNull();
  });
});

describe('chips, filter and sort', () => {
  const all = [noData, stopped, staleMoving, moving];
  it('counts per status in a fixed order', () => {
    expect(statusChips(all, NOW)).toEqual([
      { key: 'RUNNING', label: 'Moving', count: 1 },
      { key: 'STOPPED', label: 'Stopped', count: 1 },
      { key: 'NOT_REPORTING', label: 'Not reporting', count: 1 },
      { key: 'NO_DATA', label: 'Waiting for first update', count: 1 },
    ]);
  });
  it('names an unknown iALERT status instead of showing it raw', () => {
    const towed = v('ZZ00ZZ0009', { status: 'SOME_NEW_STATE', lastUpdateAt: minsAgo(1) });
    expect(statusChips([towed], NOW)).toEqual([
      { key: 'SOME_NEW_STATE', label: 'Some new state', count: 1 },
    ]);
  });
  it('filters by status and by search', () => {
    expect(filterVehicles(all, { statuses: ['RUNNING'] }, NOW)).toEqual([moving]);
    expect(filterVehicles(all, { q: '0002' }, NOW)).toEqual([stopped]);
  });
  it('sorts moving first, then by plate', () => {
    expect(sortVehicles(all, NOW).map((x) => x.registration)).toEqual([
      'ZZ00ZZ0001',
      'ZZ00ZZ0002',
      'ZZ00ZZ0003',
      'ZZ00ZZ0004',
    ]);
  });
});

describe('newestPull / exportRows', () => {
  it('stamps the page with the newest pull', () => {
    expect(newestPull([moving, stopped, noData]).toISOString()).toBe(minsAgo(1));
    expect(newestPull([noData])).toBeNull();
  });
  it('exports readable values', () => {
    const [row] = exportRows([{ ...stopped, vehicleId: 'x' }], NOW);
    expect(row).toMatchObject({
      status: 'Stopped',
      statusFor: '11h 10m',
      bs6: 'Yes',
      inFleet: 'Yes',
    });
  });
});

describe('connectionNotice', () => {
  const live = { accountStatus: 'ACTIVE', status: 'ACTIVE', expiresAt: '2026-10-21T20:30:00Z' };
  const stopped = {
    accountStatus: 'ACTIVE',
    status: 'NEEDS_REAUTH',
    canSelfRenew: false,
    expiresAt: '2026-10-21T19:51:48Z',
  };

  it('stays quiet while every link is live, or when there is no link', () => {
    expect(connectionNotice([live])).toBeNull();
    expect(connectionNotice([])).toBeNull();
    expect(connectionNotice(null)).toBeNull();
  });

  it('says data stopped, and since when, when the only link needs a new sign-in', () => {
    expect(connectionNotice([stopped])).toEqual({
      tone: 'crit',
      stopped: 1,
      total: 1,
      since: '2026-10-21T19:51:48Z',
    });
  });

  it('is a warning when only some links stopped', () => {
    expect(connectionNotice([live, stopped])).toMatchObject({ tone: 'warn', stopped: 1, total: 2 });
  });

  it('reports a link that is renewing on its own as info', () => {
    expect(connectionNotice([{ ...stopped, canSelfRenew: true }])).toMatchObject({ tone: 'info' });
  });
});
