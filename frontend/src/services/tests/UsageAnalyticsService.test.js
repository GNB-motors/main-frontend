import { beforeEach, expect, it, vi } from 'vitest';
import apiClient from '../../utils/axiosConfig';
import { getNavProfile, getUsageSummary } from '../UsageAnalyticsService';
vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('passes identical menu catalogs and cancellation to both reads', async () => {
  apiClient.get.mockResolvedValue({ data: { data: { surfaces: [], daily: [] } } });
  const options = { surfaces: ['/reports', '/usage'], signal: new AbortController().signal };
  await getNavProfile(options);
  await getUsageSummary(options);
  expect(apiClient.get).toHaveBeenNthCalledWith(1, '/api/usage/nav-profile', {
    params: { surfaces: '/reports,/usage' },
    signal: options.signal,
  });
  expect(apiClient.get).toHaveBeenNthCalledWith(2, '/api/usage/summary', {
    params: { surfaces: '/reports,/usage' },
    signal: options.signal,
  });
});
it('reports malformed summaries instead of showing false zero counts', async () => {
  apiClient.get.mockResolvedValue({ data: {} });
  await expect(getUsageSummary()).rejects.toThrow('Could not read app usage');
});
