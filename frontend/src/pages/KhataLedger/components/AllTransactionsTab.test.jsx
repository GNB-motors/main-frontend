import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AllTransactionsTab from './AllTransactionsTab';
import KhataLedgerService from '../KhataLedgerService';

vi.mock('../KhataLedgerService', () => ({
  default: {
    getExpenses: vi.fn(),
    getSummary: vi.fn(),
    getErpTrips: vi.fn(),
  },
}));
vi.mock('./ReceiptPreviewModal', () => ({ default: () => null }));
vi.mock('./FuelAnomalyModal', () => ({ default: () => null }));
vi.mock('./ErpTripDetailModal', () => ({ default: () => null }));

const rows = [
  ...Array.from({ length: 25 }, (_, i) => ({
    _id: `e${i}`,
    title: `Manual toll ${i}`,
    source: 'MANUAL',
    status: 'CONFIRMED',
    category: 'TOLL',
    amount: 100,
    expenseDate: '2026-01-01',
  })),
  {
    _id: 'pending',
    title: 'Old pending driver receipt',
    source: 'DRIVER_BILL',
    status: 'PENDING',
    category: 'TOLL',
    amount: 450,
    expenseDate: '2025-01-01',
  },
];

describe('Transaction filters before backend pagination', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    KhataLedgerService.getSummary.mockResolvedValue({ totalAmount: 450, count: 1 });
    KhataLedgerService.getErpTrips.mockResolvedValue({ data: [] });
    KhataLedgerService.getExpenses.mockImplementation(async (params) => {
      const filtered = rows.filter(
        (row) =>
          (!params.source || row.source === params.source) &&
          (!params.status || row.status === params.status),
      );
      return {
        results: filtered.slice((params.page - 1) * params.limit, params.page * params.limit),
        page: params.page,
        totalResults: filtered.length,
        totalPages: Math.ceil(filtered.length / params.limit),
      };
    });
  });

  it('finds a bill beyond the original first page and sends identical summary filters', async () => {
    render(<AllTransactionsTab />);
    await screen.findByText('Manual toll 0');
    fireEvent.click(screen.getByRole('button', { name: 'Next Page' }));
    await screen.findByText('Page 2 of 2 (26 total)');
    fireEvent.click(screen.getByRole('button', { name: 'Filters', exact: true }));
    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'DRIVER_BILL' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'PENDING' } });
    await screen.findByText('Old pending driver receipt');
    await waitFor(() =>
      expect(KhataLedgerService.getExpenses).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, limit: 20, source: 'DRIVER_BILL', status: 'PENDING' }),
      ),
    );
    expect(KhataLedgerService.getSummary).toHaveBeenLastCalledWith(
      expect.objectContaining({ source: 'DRIVER_BILL', status: 'PENDING' }),
    );
    expect(screen.queryByText('Manual toll 0')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next Page' })).not.toBeInTheDocument();
  });

  it('ignores a late response from a previous filter', async () => {
    let finishOld;
    KhataLedgerService.getExpenses.mockImplementation(({ status }) =>
      status === 'PENDING'
        ? Promise.resolve({ results: [rows[25]], totalPages: 1, page: 1, totalResults: 1 })
        : new Promise((resolve) => {
            finishOld = resolve;
          }),
    );
    render(<AllTransactionsTab />);
    fireEvent.click(screen.getByRole('button', { name: 'Filters', exact: true }));
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'PENDING' } });
    await screen.findByText('Old pending driver receipt');
    finishOld({ results: [rows[0]], totalPages: 1, page: 1, totalResults: 1 });
    await waitFor(() => expect(screen.queryByText('Manual toll 0')).not.toBeInTheDocument());
    expect(screen.getByText('Old pending driver receipt')).toBeInTheDocument();
  });
});
