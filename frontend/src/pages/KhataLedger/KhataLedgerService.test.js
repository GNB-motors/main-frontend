import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../utils/axiosConfig';
import KhataLedgerService, { getErpAvailability, resetErpAvailability } from './KhataLedgerService';

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

describe('whether the location has ERP trips yet', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetErpAvailability();
  });

  it('is false when ERP is switched off or no trip exists, true once one does', async () => {
    apiClient.get.mockRejectedValueOnce(Object.assign(new Error('Not Found'), { status: 404 }));
    expect(await getErpAvailability()).toBe(false);
    resetErpAvailability();
    apiClient.get.mockResolvedValueOnce({ data: { data: [], meta: { total: 0 } } });
    expect(await getErpAvailability()).toBe(false);
    resetErpAvailability();
    apiClient.get.mockResolvedValueOnce({ data: { data: [{ _id: 't1' }], meta: { total: 4 } } });
    expect(await getErpAvailability()).toBe(true);
    expect(apiClient.get).toHaveBeenLastCalledWith('/api/erp/trips', {
      params: { page: 1, limit: 1 },
    });
  });

  it('keeps the ERP pieces when the check itself fails, and asks only once', async () => {
    apiClient.get.mockRejectedValue(new Error('offline'));
    expect(await getErpAvailability()).toBe(true);
    await getErpAvailability();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
