import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));

import apiClient from '../../utils/axiosConfig';
import PerformanceApi from '../../api/performance';

/**
 * The heaviest reads on the largest organisation answer in about 34 s, which
 * the 30 s default budget aborts before the server replies. Those reads carry
 * their own budget; every other performance read keeps the default.
 */
const SLOW_READ_TIMEOUT = 120000;

beforeEach(() => {
  vi.clearAllMocks();
  apiClient.get.mockResolvedValue({ data: { data: {} } });
});

/** The axios config the API sent for one URL, or null when it sent none. */
const configFor = (url) => {
  const call = apiClient.get.mock.calls.find(([called]) => called === url);
  return call ? call[1] : null;
};

describe('performance read budgets', () => {
  it('gives the three heavy reads a two-minute budget', async () => {
    await PerformanceApi.vehicles();
    await PerformanceApi.drivers();
    await PerformanceApi.leaderboards();

    expect(configFor('/api/performance/vehicles').timeout).toBe(SLOW_READ_TIMEOUT);
    expect(configFor('/api/performance/drivers').timeout).toBe(SLOW_READ_TIMEOUT);
    expect(configFor('/api/performance/leaderboards').timeout).toBe(SLOW_READ_TIMEOUT);
  });

  it('leaves the other performance reads on the default budget', async () => {
    await PerformanceApi.vehicle('veh-1');
    await PerformanceApi.driver('drv-1');
    await PerformanceApi.boards();

    expect(configFor('/api/performance/vehicles/veh-1').timeout).toBeUndefined();
    expect(configFor('/api/performance/drivers/drv-1').timeout).toBeUndefined();
    expect(configFor('/api/leaderboards/boards').timeout).toBeUndefined();
  });

  it('still sends the params and the abort signal with the budget', async () => {
    const signal = new AbortController().signal;
    await PerformanceApi.vehicles({ window: '30d' }, signal);

    const config = configFor('/api/performance/vehicles');
    expect(config.params).toEqual({ window: '30d' });
    expect(config.signal).toBe(signal);
    expect(config.timeout).toBe(SLOW_READ_TIMEOUT);
  });
});
