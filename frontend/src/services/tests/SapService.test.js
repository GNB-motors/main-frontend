import { beforeEach, expect, it, vi } from 'vitest';
import apiClient from '../../utils/axiosConfig';
import SapService from '../SapService';
vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('normalizes the Mongo summary array into rows for the route performance view', async () => {
  const rows = [{ group: '2026-11', trips: 3, extraKm: 42 }];
  apiClient.get.mockResolvedValue({ data: { data: rows } });
  expect(await SapService.summary({ groupBy: 'month' })).toEqual({ rows });
});
it('preserves warehouse rows and pricing coverage metadata', async () => {
  const data = { rows: [{ group: '2026-11', extraInr: null, unpricedTrips: 2 }], trips: 2 };
  apiClient.get.mockResolvedValue({ data: { data } });
  expect(await SapService.summary()).toEqual(data);
});
