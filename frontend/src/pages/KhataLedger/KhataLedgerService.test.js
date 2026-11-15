import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../utils/axiosConfig';
import KhataLedgerService from './KhataLedgerService';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));

describe('complete dashboard data through backend pages', () => {
  beforeEach(() => vi.resetAllMocks());

  it('walks expense pages with the supported limit and preserves scope and cancellation', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { data: { results: [{ amount: 100 }], totalPages: 2 } } })
      .mockResolvedValueOnce({ data: { data: { results: [{ amount: 250 }], totalPages: 2 } } });
    const { signal } = new AbortController();
    const rows = await KhataLedgerService.getDashboardExpenses(
      { branchId: 'branch', source: 'FUEL' },
      { signal },
    );
    expect(rows).toEqual([{ amount: 100 }, { amount: 250 }]);
    for (const page of [1, 2])
      expect(apiClient.get).toHaveBeenNthCalledWith(page, '/api/expenses', {
        params: { branchId: 'branch', source: 'FUEL', page, limit: 100 },
        signal,
      });
  });

  it('uses trip pagination metadata outside the data array', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { data: [{ _id: 't1' }], meta: { totalPages: 2 } } })
      .mockResolvedValueOnce({ data: { data: [{ _id: 't2' }], meta: { totalPages: 2 } } });
    expect(await KhataLedgerService.getDashboardTrips({})).toEqual([{ _id: 't1' }, { _id: 't2' }]);
  });

  it('rejects a failed or incomplete page rather than returning partial totals', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { data: { results: [{ amount: 100 }], totalPages: 2 } } })
      .mockRejectedValueOnce(new Error('offline'));
    await expect(KhataLedgerService.getDashboardExpenses({})).rejects.toThrow('offline');
    apiClient.get.mockResolvedValue({ data: { data: { results: [], totalPages: 2 } } });
    await expect(KhataLedgerService.getDashboardExpenses({})).rejects.toThrow('incomplete');
  });
});
