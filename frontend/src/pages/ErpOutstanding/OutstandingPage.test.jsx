import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OutstandingPage from './OutstandingPage';
import OutstandingApi from './OutstandingService';

vi.mock('./OutstandingService', () => ({
  default: {
    getSummary: vi.fn(),
    getPartyWise: vi.fn(),
    list: vi.fn(),
    exportCsv: vi.fn(),
  },
}));

/**
 * Outstanding shows three independent reads. One of them failing must not take
 * the other two down with it, and the owner must never read a server's private
 * wording on the screen.
 */

const SUMMARY = {
  totalOutstanding: 100,
  overdueTotal: 40,
  dueTodayTotal: 10,
  partyCount: 2,
};

const BILLS = [
  {
    billId: 'b1',
    billNumber: 'B-1',
    partyName: 'Asha',
    dueDate: '2026-11-10T00:00:00Z',
    outstandingAmount: 100,
    overdueDays: 1,
    ageingBucket: 'CURRENT',
    remarks: '',
  },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <OutstandingPage />
    </MemoryRouter>,
  );

describe('ERP outstanding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    OutstandingApi.getSummary.mockResolvedValue({ data: SUMMARY });
    OutstandingApi.list.mockResolvedValue({ data: BILLS });
    OutstandingApi.getPartyWise.mockRejectedValue({
      status: 500,
      message: 'secret internal detail',
    });
  });

  it('keeps the bills when the party-wise request fails and offers a retry for that section', async () => {
    renderPage();

    // The bill list survived the failed party-wise read.
    expect(await screen.findByText('B-1')).toBeInTheDocument();
    // The summary is still on screen too.
    const totalStat = screen.getByText('Total outstanding').parentElement;
    expect(within(totalStat).getByText('₹100')).toBeInTheDocument();

    // The party-wise section says what went wrong in plain words, and can be
    // retried on its own.
    fireEvent.click(screen.getByRole('button', { name: 'Party-wise' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/server had a problem/i);
    expect(within(alert).getByRole('button', { name: /retry/i })).toBeInTheDocument();

    // The server's own wording never reaches the screen.
    expect(screen.queryByText(/secret internal detail/)).not.toBeInTheDocument();
  });
});
