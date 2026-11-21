import { changeField } from '@/test/changeField';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ErpTripsTab from './ErpTripsTab';
import KhataLedgerService from '../KhataLedgerService';

vi.mock('../KhataLedgerService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      getErpTrips: vi.fn(),
      getErpTripFinance: vi.fn(),
    },
  };
});
vi.mock('../../../contexts/BranchContext', () => ({
  useActiveBranch: () => ({ branchId: 'branch-1', activeBranch: { name: 'Pune' } }),
}));
vi.mock('../../../utils/logger.js', () => ({ default: { error: vi.fn() } }));
vi.mock('./ErpTripDetailModal', () => ({ default: () => null }));

const notFound = () => {
  const err = new Error('Not Found');
  err.status = 404;
  return err;
};

describe('ERP trips tab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    KhataLedgerService.getErpTrips.mockResolvedValue({ data: [], meta: { total: 0 } });
    KhataLedgerService.getErpTripFinance.mockResolvedValue(null);
  });

  it('says ERP is switched off when the trip endpoint answers 404', async () => {
    KhataLedgerService.getErpTrips.mockRejectedValue(notFound());
    render(<ErpTripsTab />);
    expect(
      await screen.findAllByText("ERP isn't switched on for your organisation"),
    ).not.toHaveLength(0);
    expect(screen.queryByText('No ERP trips found')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a retryable error, not an empty list, when the trip list fails', async () => {
    const failed = new Error('Request failed');
    failed.response = { status: 400, data: { message: '"state" must be one of [PLANNED, …]' } };
    KhataLedgerService.getErpTrips.mockRejectedValueOnce(failed);
    render(<ErpTripsTab />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load ERP trips');
    expect(screen.queryByText('No ERP trips found')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findAllByText('No ERP trips found');
    expect(KhataLedgerService.getErpTrips).toHaveBeenCalledTimes(2);
  });

  it('filters by the trip states the backend accepts', async () => {
    render(<ErpTripsTab />);
    await screen.findAllByText('No ERP trips found');
    changeField(screen.getByLabelText('Status'), { target: { value: 'TRIP_CLOSED' } });
    await waitFor(() =>
      expect(KhataLedgerService.getErpTrips).toHaveBeenLastCalledWith({
        page: 1,
        limit: 20,
        state: 'TRIP_CLOSED',
      }),
    );
  });

  it('asks only for query fields the trip endpoint accepts', async () => {
    render(<ErpTripsTab drivers={[{ _id: 'driver-a', firstName: 'Ravi' }]} />);
    await screen.findAllByText('No ERP trips found');
    expect(KhataLedgerService.getErpTrips).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('narrows the loaded trips by driver on the page', async () => {
    KhataLedgerService.getErpTrips.mockResolvedValue({
      data: [
        { _id: 't1', tripNumber: 'TRIP-1', driverId: 'driver-a', tripDate: '2026-01-02' },
        { _id: 't2', tripNumber: 'TRIP-2', driverId: 'driver-b', tripDate: '2026-01-03' },
      ],
      meta: { total: 2 },
    });
    render(<ErpTripsTab drivers={[{ _id: 'driver-a', firstName: 'Ravi' }]} />);
    expect(await screen.findByText('TRIP-1')).toBeInTheDocument();
    changeField(screen.getByLabelText('Driver'), { target: { value: 'driver-a' } });
    await waitFor(() => expect(screen.queryByText('TRIP-2')).not.toBeInTheDocument());
    expect(screen.getByText('TRIP-1')).toBeInTheDocument();
  });
});
