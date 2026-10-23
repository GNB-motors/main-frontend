import { vi, it, expect, beforeEach } from 'vitest';
import AutoTripService from '../AutoTripService';
import apiClient from '../../utils/axiosConfig';
vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('passes the drop filter and abort signal to the server and preserves server counts', async () => {
  const signal = new AbortController().signal;
  const params = { dropSiteId: 'wanted', status: 'NEEDS_REVIEW', page: 2, limit: 50 };
  apiClient.get.mockResolvedValue({
    data: {
      data: {
        items: [{ _id: 'matching', status: 'NEEDS_REVIEW', drop: { orgSiteId: 'merged' } }],
        total: 75,
        page: 2,
        limit: 50,
        tabCounts: { NEEDS_REVIEW: 75, COMPLETE: 20 },
      },
    },
  });
  expect(await AutoTripService.list(params, { signal })).toMatchObject({
    total: 75,
    page: 2,
    items: [{ _id: 'matching' }],
    tabCounts: { COMPLETE: 20 },
  });
  expect(apiClient.get).toHaveBeenCalledTimes(1);
  expect(apiClient.get).toHaveBeenCalledWith('/api/auto-trips', { params, signal });
});
it('surfaces invalid filters without downloading the whole trip history', async () => {
  apiClient.get.mockRejectedValue({ status: 400 });
  await expect(AutoTripService.list({ dropSiteId: 'invalid' })).rejects.toMatchObject({
    status: 400,
  });
  expect(apiClient.get).toHaveBeenCalledTimes(1);
});
