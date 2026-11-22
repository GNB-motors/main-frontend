import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Account360Page from './Account360Page';
import { getEntityById } from '../../components/Erp/entityLookup.service';
import LedgerApi from '../ErpLedger/LedgerService';
import OutstandingApi from '../ErpOutstanding/OutstandingService';

// The route parameters are the identity of the account on screen.
const { routeParams } = vi.hoisted(() => ({
  routeParams: { accountType: 'party', accountId: 'p1' },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useParams: () => ({ ...routeParams }) };
});

vi.mock('../../components/Erp/entityLookup.service', async (importOriginal) => ({
  ...(await importOriginal()),
  getEntityById: vi.fn(),
}));

vi.mock('../ErpLedger/LedgerService', () => ({
  default: {
    getBalance: vi.fn(),
    getStatement: vi.fn(),
    exportStatementCsv: vi.fn(),
  },
}));

vi.mock('../ErpOutstanding/OutstandingService', () => ({
  default: { list: vi.fn() },
}));

/**
 * Account 360 is the "keep track" screen. A header read that failed must be
 * said out loud and retryable, and a statement total the server never sent is
 * unknown — it is not zero rupees.
 */

const renderPage = () =>
  render(
    <MemoryRouter>
      <Account360Page />
    </MemoryRouter>,
  );

describe('Account 360', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeParams.accountType = 'party';
    routeParams.accountId = 'p1';
    getEntityById.mockResolvedValue({ id: 'p1', name: 'Asha Traders', code: 'A-1' });
    LedgerApi.getBalance.mockResolvedValue({ data: { balance: 100, debit: 100, credit: 0 } });
    LedgerApi.getStatement.mockResolvedValue({ data: { entries: [] } });
    OutstandingApi.list.mockResolvedValue({ data: [] });
  });

  it('shows a retryable header failure and clears the previous account', async () => {
    getEntityById.mockImplementation((type, id) =>
      id === 'p1'
        ? Promise.resolve({ id: 'p1', name: 'Asha Traders', code: 'A-1' })
        : Promise.reject({ status: 500, message: 'lookup exploded' }),
    );

    const view = renderPage();
    expect((await screen.findAllByText('Asha Traders')).length).toBeGreaterThan(0);

    // The owner moves to another account and the master lookup fails.
    routeParams.accountId = 'p2';
    view.rerender(
      <MemoryRouter>
        <Account360Page />
      </MemoryRouter>,
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/couldn.t load this account/i);
    expect(within(alert).getByRole('button', { name: /retry/i })).toBeInTheDocument();
    // The previous account is never shown under the new one.
    expect(screen.queryByText('Asha Traders')).not.toBeInTheDocument();
  });

  it('shows missing statement totals as unavailable rather than ₹0', async () => {
    const view = renderPage();

    const opening = await screen.findByText('Opening');
    const openingStat = opening.parentElement;
    expect(within(openingStat).getByText('—')).toBeInTheDocument();
    expect(within(openingStat).getByText(/total unavailable/i)).toBeInTheDocument();
    expect(within(openingStat).queryByText('₹0')).not.toBeInTheDocument();

    // None of the four statement totals is a made-up zero.
    const grid = document.querySelector('.erp-stat-grid');
    expect(within(grid).queryByText('₹0')).not.toBeInTheDocument();
    expect(within(grid).getAllByText(/total unavailable/i)).toHaveLength(4);

    // A total the server really did send as zero stays a zero.
    view.unmount();
    LedgerApi.getStatement.mockResolvedValue({
      data: { entries: [], openingBalance: 0, closingBalance: 0, totals: { debit: 0, credit: 0 } },
    });
    renderPage();
    await screen.findByText('Opening');
    const zeroGrid = document.querySelector('.erp-stat-grid');
    expect(within(zeroGrid).getAllByText('₹0')).toHaveLength(4);
    expect(within(zeroGrid).queryByText(/total unavailable/i)).not.toBeInTheDocument();
  });
});
