import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));
vi.mock('../../utils/session.js', () => ({
  getUserId: vi.fn(() => 'u1'),
  getOrgId: vi.fn(() => 'org1'),
  getBranchId: vi.fn(() => null),
}));

import apiClient from '../../utils/axiosConfig';
import { getOrgId } from '../../utils/session.js';
import RouteHubService from '../RouteHubService';

const fleetResponse = { data: { data: { vehicles: [], fleet: { eventCount: 3 } } } };
const HOUR = 3600000;

// Each test uses its own day so the module's minute cache never carries over.
let day = 0;
const windowAt = (offsetMs = 0) => {
  day += 1;
  const to = Date.UTC(2026, 9, day, 10, 15, 0) + offsetMs;
  return { from: new Date(to - 24 * HOUR).toISOString(), to: new Date(to).toISOString() };
};
const shift = ({ from, to }, ms) => ({
  from: new Date(Date.parse(from) + ms).toISOString(),
  to: new Date(Date.parse(to) + ms).toISOString(),
});

describe('RouteHubService.getFleetOverspeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-17T10:00:00Z'));
    getOrgId.mockReturnValue('org1');
    apiClient.get.mockResolvedValue(fleetResponse);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('floors the window to the minute and shares one request within it', async () => {
    const w = windowAt(12_345);
    const thresholds = { speedKmh: 60, durationSec: 180 };

    const [a, b] = await Promise.all([
      RouteHubService.getFleetOverspeed({ ...w, ...thresholds }),
      RouteHubService.getFleetOverspeed({ ...shift(w, 30_000), ...thresholds }),
    ]);

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    const { params } = apiClient.get.mock.calls[0][1];
    expect(params.to.endsWith(':00.000Z')).toBe(true);
    expect(Date.parse(params.to) - Date.parse(params.from)).toBe(24 * HOUR);
    expect(a.totals).toEqual({ eventCount: 3 });
    expect(b).toBe(a);
  });

  it('different thresholds, org or minute are different requests', async () => {
    const w = windowAt();
    await RouteHubService.getFleetOverspeed({ ...w, speedKmh: 60, durationSec: 180 });
    await RouteHubService.getFleetOverspeed({ ...w, speedKmh: 80, durationSec: 180 });
    getOrgId.mockReturnValue('org2');
    await RouteHubService.getFleetOverspeed({ ...w, speedKmh: 60, durationSec: 180 });
    getOrgId.mockReturnValue('org1');
    await RouteHubService.getFleetOverspeed({
      ...shift(w, 60_000),
      speedKmh: 60,
      durationSec: 180,
    });

    expect(apiClient.get).toHaveBeenCalledTimes(4);
  });

  it('asks again once the shared answer is a minute old', async () => {
    const args = { ...windowAt(), speedKmh: 60, durationSec: 180 };
    await RouteHubService.getFleetOverspeed(args);
    vi.setSystemTime(new Date('2026-10-17T10:01:00Z'));
    await RouteHubService.getFleetOverspeed(args);

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('a failed request is not kept: the next call retries', async () => {
    const args = { ...windowAt(), speedKmh: 60, durationSec: 180 };
    apiClient.get.mockRejectedValueOnce(new Error('boom'));

    await expect(RouteHubService.getFleetOverspeed(args)).rejects.toThrow('boom');
    await expect(RouteHubService.getFleetOverspeed(args)).resolves.toMatchObject({
      totals: { eventCount: 3 },
    });
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('an aborted caller detaches without cancelling the shared request', async () => {
    const args = { ...windowAt(), speedKmh: 60, durationSec: 180 };
    const ac = new AbortController();
    const first = RouteHubService.getFleetOverspeed(args, ac.signal);
    const second = RouteHubService.getFleetOverspeed(args);
    ac.abort();

    await expect(first).rejects.toMatchObject({ code: 'ERR_CANCELED' });
    await expect(second).resolves.toMatchObject({ totals: { eventCount: 3 } });
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
