import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import KhataReportsTab from './KhataReportsTab';
import KhataLedgerService from '../KhataLedgerService';

vi.mock('../KhataLedgerService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      getDashboardExpenses: vi.fn(),
      getErpTrips: vi.fn(),
      getErpTripFinance: vi.fn(),
    },
  };
});
vi.mock('../../../contexts/BranchContext', () => ({
  useActiveBranch: () => ({ branchId: 'branch-1', activeBranch: { name: 'Pune' } }),
}));
vi.mock('../../../utils/logger.js', () => ({ default: { error: vi.fn() } }));

describe('financial reports tab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    KhataLedgerService.getDashboardExpenses.mockResolvedValue([]);
    KhataLedgerService.getErpTrips.mockResolvedValue({ data: [] });
    KhataLedgerService.getErpTripFinance.mockResolvedValue(null);
  });

  it('reads expenses page by page instead of asking for an unsupported limit', async () => {
    render(<KhataReportsTab />);
    await waitFor(() => expect(KhataLedgerService.getDashboardExpenses).toHaveBeenCalled());
    const [params] = KhataLedgerService.getDashboardExpenses.mock.calls[0];
    expect(params.limit).toBeUndefined();
    expect(params.includeTripExpenses).toBe(true);
  });

  it('sends only query fields the trip endpoint accepts', async () => {
    render(<KhataReportsTab />);
    await waitFor(() => expect(KhataLedgerService.getErpTrips).toHaveBeenCalled());
    const [params] = KhataLedgerService.getErpTrips.mock.calls[0];
    expect(params.branchId).toBeUndefined();
    expect(params.driverId).toBeUndefined();
    expect(params.limit).toBe(200);
  });
});
