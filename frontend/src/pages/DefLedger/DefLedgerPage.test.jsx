import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DefLedgerPage from './DefLedgerPage';
import useApi from '../../hooks/useApi';

vi.mock('../../hooks/useApi', () => ({ default: vi.fn(), useApi: vi.fn() }));
vi.mock('../../services/manufacturerService', () => ({
  getManufacturerCatalog: vi.fn().mockResolvedValue([]),
}));

/**
 * The DEF ledger is where an owner looks for excuses. It has to be readable:
 * a figure that is not there is a dash with a reason, a clean vehicle says so
 * quietly, and the way into the detail is a button with a name.
 */

const DATA = {
  claimsTracked: false,
  defPriceInrPerL: 82,
  totals: {
    vehicles: 5,
    withData: 5,
    claimedAdblueL: 0,
    telemetryDefL: 120,
    sensorFillL: 5431.8,
    dosingRatioPct: 4.3,
    flagged: 2,
  },
  vehicles: [
    {
      vehicleId: 'v1',
      registrationNumber: 'WB11L8862',
      claimedAdblueL: null,
      telemetryDefL: 40,
      sensorFillL: 1200,
      expectedBalanceL: 120,
      dosingRatioPct: 4.1,
      status: 'COMPLIANT',
      flagCount: 0,
    },
    {
      vehicleId: 'v2',
      registrationNumber: 'WB11L8863',
      claimedAdblueL: null,
      telemetryDefL: 80,
      sensorFillL: 2400,
      expectedBalanceL: -30,
      dosingRatioPct: 4.9,
      status: 'FLAGGED',
      flagCount: 2,
    },
  ],
};

const renderPage = async () => {
  const utils = render(
    <MemoryRouter>
      <DefLedgerPage />
    </MemoryRouter>,
  );
  // Let the manufacturer catalogue settle before the assertions.
  await act(async () => {});
  return utils;
};

const rowFor = (plate) => screen.getByText(plate).closest('tr');

/** The KPI tile whose label says this — the label is the only uppercased span up there. */
const tileFor = (label) => {
  const node = Array.from(document.querySelectorAll('span')).find(
    (n) => n.textContent === label && n.className.includes('uppercase'),
  );
  return node.closest('div');
};

describe('DEF ledger page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useApi.mockReturnValue({ data: DATA, loading: false, error: null, refetch: vi.fn() });
  });

  it('says what the page is', async () => {
    await renderPage();
    expect(screen.getByText('DEF & AdBlue')).toBeInTheDocument();
  });

  it('shows a dash, and the reason, when no AdBlue was ever logged', async () => {
    await renderPage();
    const tile = tileFor('AdBlue logged (in window)');
    expect(within(tile).getByText('—')).toBeInTheDocument();
    expect(within(tile).getByText(/No AdBlue bills logged/)).toBeInTheDocument();
    expect(within(tile).getByText(/sensors saw .* go in/)).toBeInTheDocument();
  });

  it('counts the vehicles that need a look, with the unit beside the figure', async () => {
    await renderPage();
    const tile = tileFor('Needs review');
    expect(within(tile).getByText('2')).toBeInTheDocument();
    expect(within(tile).getByText('vehicles')).toBeInTheDocument();
  });

  it('says a clean vehicle has no flags with a dash, not a zero', async () => {
    await renderPage();
    expect(within(rowFor('WB11L8862')).getByText('—')).toBeInTheDocument();
    expect(within(rowFor('WB11L8863')).getByText('2 flags')).toBeInTheDocument();
  });

  it('opens the detail with a button that says what it does', async () => {
    await renderPage();
    expect(screen.getAllByRole('button', { name: 'Details' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Audit Drawer/i })).not.toBeInTheDocument();
  });
});
