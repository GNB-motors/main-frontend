import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));

import apiClient from '../../utils/axiosConfig';
import AdvanceService from './AdvanceService';

// Advance Masters switches tabs through useApi; the request for the tab the
// user left must be cancellable, not just ignored.
describe('AdvanceService master reads forward the abort signal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { data: [] } });
  });

  it.each([
    ['getMileage', '/mileage', { limit: 200 }],
    ['getFuelRates', '/fuel-rates', {}],
    ['getRouteBudgets', '/route-budgets', { limit: 200 }],
  ])('%s', async (method, suffix, params) => {
    const { signal } = new AbortController();
    await AdvanceService[method](params, { signal });
    const [url, config] = apiClient.get.mock.calls[0];
    expect(url.endsWith(suffix)).toBe(true);
    expect(config).toEqual({ params, signal });
  });
});
