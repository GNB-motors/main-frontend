import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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
    render(<KhataReportsTab erpAvailable />);
    await waitFor(() => expect(KhataLedgerService.getDashboardExpenses).toHaveBeenCalled());
    const [params] = KhataLedgerService.getDashboardExpenses.mock.calls[0];
    expect(params.limit).toBeUndefined();
    expect(params.includeTripExpenses).toBe(true);
  });

  it('sends only query fields the trip endpoint accepts', async () => {
    render(<KhataReportsTab erpAvailable />);
    await waitFor(() => expect(KhataLedgerService.getErpTrips).toHaveBeenCalled());
    const [params] = KhataLedgerService.getErpTrips.mock.calls[0];
    expect(params.branchId).toBeUndefined();
    expect(params.driverId).toBeUndefined();
    expect(params.limit).toBe(200);
  });

  it('shows a dash, not zero, for a trip whose finances did not load', async () => {
    const now = new Date().toISOString();
    KhataLedgerService.getErpTrips.mockResolvedValue({
      data: [
        { _id: 'aaaaaaaaaaaa', tripNumber: 'TRP-1', tripDate: now, state: 'DELIVERED' },
        { _id: 'bbbbbbbbbbbb', tripNumber: 'TRP-2', tripDate: now, state: 'PLACED' },
      ],
    });
    KhataLedgerService.getErpTripFinance.mockImplementation(async (id) =>
      id === 'aaaaaaaaaaaa' ? { margin: { revenue: 9000, cost: 4000 } } : null,
    );
    render(<KhataReportsTab erpAvailable />);
    const known = (await screen.findByText('TRP-1')).closest('tr');
    expect(within(known).getByText('₹5,000')).toBeInTheDocument();
    expect(within(known).getByText('Delivered')).toBeInTheDocument();
    const unknown = screen.getByText('TRP-2').closest('tr');
    expect(within(unknown).queryByText('₹0')).not.toBeInTheDocument();
    expect(within(unknown).getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });
});
