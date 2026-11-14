import { changeField } from '@/test/changeField';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
  it('applies the Digest pending-bills and date filters before requesting a page', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          '/khata-ledger?tab=all&expenseStatus=PENDING&from=2026-11-04&to=2026-11-04',
        ]}
      >
        <AllTransactionsTab />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(KhataLedgerService.getExpenses).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDING',
          startDate: '2026-11-03T18:30:00.000Z',
          endDate: '2026-11-04T18:29:59.999Z',
        }),
      ),
    );
    expect(KhataLedgerService.getSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PENDING',
        startDate: '2026-11-03T18:30:00.000Z',
        endDate: '2026-11-04T18:29:59.999Z',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Filters', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset All Filters' }));
    await waitFor(() =>
      expect(KhataLedgerService.getExpenses).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ status: 'PENDING' }),
      ),
    );
    expect(KhataLedgerService.getExpenses.mock.calls.at(-1)[0].startDate).toBeUndefined();
    expect(KhataLedgerService.getExpenses.mock.calls.at(-1)[0].endDate).toBeUndefined();
  });
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
    render(
      <MemoryRouter>
        <AllTransactionsTab />
      </MemoryRouter>,
    );
    await screen.findByText('Manual toll 0');
    fireEvent.click(screen.getByRole('button', { name: 'Next Page' }));
    await screen.findByText('Page 2 of 2 (26 total)');
    fireEvent.click(screen.getByRole('button', { name: 'Filters', exact: true }));
    changeField(screen.getByLabelText('Source'), { target: { value: 'DRIVER_BILL' } });
    changeField(screen.getByLabelText('Status'), { target: { value: 'PENDING' } });
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
    render(
      <MemoryRouter>
        <AllTransactionsTab />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Filters', exact: true }));
    changeField(screen.getByLabelText('Status'), { target: { value: 'PENDING' } });
    await screen.findByText('Old pending driver receipt');
    finishOld({ results: [rows[0]], totalPages: 1, page: 1, totalResults: 1 });
    await waitFor(() => expect(screen.queryByText('Manual toll 0')).not.toBeInTheDocument());
    expect(screen.getByText('Old pending driver receipt')).toBeInTheDocument();
  });
});
