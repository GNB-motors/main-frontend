import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KhataDashboardTab from './KhataDashboardTab';
import KhataLedgerService from '../KhataLedgerService';

vi.mock('../KhataLedgerService', () => ({
  default: {
    getDashboardExpenses: vi.fn(),
    getDashboardTrips: vi.fn(),
    getErpTripFinance: vi.fn(),
  },
}));
vi.mock('../../../contexts/BranchContext', () => ({
  useActiveBranch: () => ({ branchId: null, activeBranch: null }),
}));
vi.mock('../../../utils/logger.js', () => ({ default: { error: vi.fn() } }));
vi.mock('./KhataDashboardCharts', () => ({
  default: () => <section aria-label="Spending insights" />,
}));
vi.mock('./ErpTripDetailModal', () => ({ default: () => null }));

describe('dashboard data states', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    KhataLedgerService.getDashboardExpenses.mockResolvedValue([
      { amount: 3500, category: 'TOLL', source: 'MANUAL' },
    ]);
    KhataLedgerService.getDashboardTrips.mockResolvedValue([]);
  });

  it('shows an error instead of zero metrics, and can retry the request', async () => {
    KhataLedgerService.getDashboardExpenses.mockRejectedValueOnce(new Error('HTTP 400'));
    const { container } = render(<KhataDashboardTab />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Financial overview unavailable');
    expect(container.querySelector('.khata-kpis')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    await waitFor(() => expect(container.querySelector('.ov-kpi')).toHaveTextContent('₹3,500'));
    expect(KhataLedgerService.getDashboardExpenses).toHaveBeenCalledTimes(2);
  });

  it('marks profit unavailable if any in-period trip finance is missing', async () => {
    const now = new Date().toISOString();
    KhataLedgerService.getDashboardTrips.mockResolvedValue([
      { _id: 't1', tripDate: now },
      { _id: 't2', tripDate: now },
      { _id: 'old', tripDate: '2000-01-01' },
    ]);
    KhataLedgerService.getErpTripFinance.mockImplementation(async (id) =>
      id === 't1' ? { margin: { revenue: 8000, cost: 1000 } } : null,
    );
    const { container } = render(<KhataDashboardTab />);
    await screen.findByText('Partial data');
    const profit = [...container.querySelectorAll('.ov-kpi')].find((tile) =>
      tile.textContent.includes('Net Profit'),
    );
    expect(profit).toHaveTextContent('Unavailable');
    expect(screen.getByText('Finances available for 1 of 2 trips')).toBeInTheDocument();
    expect(KhataLedgerService.getErpTripFinance).toHaveBeenCalledTimes(2);
  });

  it('aborts outstanding dashboard loads on unmount', () => {
    KhataLedgerService.getDashboardExpenses.mockImplementation(() => new Promise(() => {}));
    const view = render(<KhataDashboardTab />);
    const signal = KhataLedgerService.getDashboardExpenses.mock.calls[0][1].signal;
    view.unmount();
    expect(signal.aborted).toBe(true);
  });

  it('filters trip finances by driver without sending an unsupported trip query field', async () => {
    const now = new Date().toISOString();
    KhataLedgerService.getDashboardTrips.mockResolvedValue([
      { _id: 't1', tripDate: now, driverId: 'driver-a' },
      { _id: 't2', tripDate: now, driverId: 'driver-b' },
    ]);
    KhataLedgerService.getErpTripFinance.mockResolvedValue({
      margin: { revenue: 5000, cost: 1000 },
    });
    render(<KhataDashboardTab drivers={[{ _id: 'driver-a', firstName: 'Ravi' }]} />);
    await screen.findByText('Finances available for 2 of 2 trips');
    KhataLedgerService.getErpTripFinance.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Filter Scope' }));
    fireEvent.change(screen.getByLabelText('Driver'), { target: { value: 'driver-a' } });
    await screen.findByText('Finances available for 1 of 1 trips');
    expect(KhataLedgerService.getDashboardTrips).toHaveBeenLastCalledWith({}, expect.anything());
    expect(KhataLedgerService.getErpTripFinance).toHaveBeenCalledTimes(1);
    expect(KhataLedgerService.getErpTripFinance).toHaveBeenCalledWith('t1', expect.anything());
  });
});
