import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, act, fireEvent } from '@testing-library/react';
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
    vehicles: 2,
    withData: 2,
    claimedAdblueL: 0,
    telemetryDefL: 120,
    sensorFillL: 5431.8,
    dosingRatioPct: 4.3,
    flagged: 1,
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
    expect(within(tile).getByText('1')).toBeInTheDocument();
    expect(within(tile).getByText('vehicles')).toBeInTheDocument();
  });

  it('keeps Needs review tile and chip at three vehicles while nine deficits stay under Unlogged burn', async () => {
    const vehicles = Array.from({ length: 12 }, (_, i) => ({
      ...DATA.vehicles[1],
      vehicleId: `v${i + 1}`,
      registrationNumber: `WB25R${9540 + i}`,
      status: i < 3 ? 'FLAGGED' : 'DEFICIT',
      flagCount: i === 2 ? 2 : 1,
    }));
    useApi.mockReturnValue({
      data: {
        ...DATA,
        claimsTracked: true,
        vehicles,
        totals: { ...DATA.totals, vehicles: 12, withData: 12, flagged: 3 },
      },
      loading: false,
      refetch: vi.fn(),
    });
    await renderPage();
    expect(within(tileFor('Needs review')).getByText('3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Needs review (3)' }));
    expect(screen.getAllByRole('button', { name: 'Details' })).toHaveLength(3);
    expect(screen.getByText(vehicles[2].registrationNumber)).toBeInTheDocument();
    expect(screen.queryByText(vehicles[3].registrationNumber)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Unlogged burn (9)' }));
    expect(screen.getAllByRole('button', { name: 'Details' })).toHaveLength(9);
    expect(screen.queryByText(vehicles[2].registrationNumber)).not.toBeInTheDocument();
    expect(screen.getByText(vehicles[3].registrationNumber)).toBeInTheDocument();
  });

  it('says a clean vehicle has no flags with a dash, not a zero', async () => {
    await renderPage();
    expect(within(rowFor('WB11L8862')).getAllByText('—').length).toBeGreaterThan(0);
    expect(within(rowFor('WB11L8863')).getByText('2 flags')).toBeInTheDocument();
  });

  it('opens the detail with a button that says what it does', async () => {
    await renderPage();
    expect(screen.getAllByRole('button', { name: 'Details' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Audit Drawer/i })).not.toBeInTheDocument();
  });

  it('uses each vehicle’s logging state in a fleet where only one truck has AdBlue entries', async () => {
    const tracked = {
      ...DATA.vehicles[0],
      claimsTracked: true,
      claimedAdblueL: 5,
      expectedBalanceL: -35,
      status: 'DEFICIT',
      flags: [{ type: 'NEGATIVE_BALANCE' }],
      flagCount: 1,
    };
    const untracked = {
      ...DATA.vehicles[1],
      claimsTracked: false,
      claimedAdblueL: null,
      expectedBalanceL: null,
      status: 'COMPLIANT',
      flags: [],
      flagCount: 0,
    };
    useApi.mockReturnValue({
      data: {
        ...DATA,
        claimsTracked: true,
        vehicles: [tracked, untracked],
        totals: { ...DATA.totals, claimedAdblueL: 5, flagged: 0 },
      },
      loading: false,
      refetch: vi.fn(),
    });
    await renderPage();
    expect(within(rowFor(tracked.registrationNumber)).getByText('5 L')).toBeInTheDocument();
    const otherRow = rowFor(untracked.registrationNumber);
    expect(within(otherRow).getByText('Not logged')).toBeInTheDocument();
    expect(within(otherRow).queryByText('0 L')).not.toBeInTheDocument();
    expect(within(otherRow).getByText('80 L')).toBeInTheDocument();
    fireEvent.click(within(otherRow).getByRole('button', { name: 'Details' }));
    const drawer = screen.getByRole('dialog');
    expect(within(drawer).getByText('Not logged')).toBeInTheDocument();
    expect(
      within(drawer).getByText(/No AdBlue purchases are logged for this vehicle/),
    ).toBeInTheDocument();
    expect(within(drawer).queryByText(/for this organization/)).not.toBeInTheDocument();
    expect(within(drawer).queryByText('Unlogged burn')).not.toBeInTheDocument();
  });

  it('shows suppressed findings in the Held back chip and drawer without counting them as active review', async () => {
    const held = {
      ...DATA.vehicles[0],
      status: 'HELD_BACK',
      alertsSuppressed: true,
      flagCount: 1,
      flags: [
        {
          type: 'DEF_DRAIN_SENSOR',
          message: 'Sensor drop needs a look',
          litres: 12,
          at: '2026-11-09T06:00:00Z',
        },
      ],
    };
    useApi.mockReturnValue({
      data: { ...DATA, totals: { ...DATA.totals, flagged: 0 }, vehicles: [held] },
      loading: false,
      refetch: vi.fn(),
    });
    await renderPage();
    expect(within(tileFor('Needs review')).getByText('0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Needs review (0)' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Held back (1)' }));
    const row = rowFor(held.registrationNumber);
    expect(within(row).getByText('Assessment held back')).toBeInTheDocument();
    expect(within(row).getByText('1 held back')).toBeInTheDocument();
    expect(within(row).queryByText('In band')).not.toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: 'Details' }));
    const drawer = screen.getByRole('dialog');
    expect(within(drawer).getByText('Assessment held back')).toBeInTheDocument();
    expect(
      within(drawer).getByRole('heading', { name: 'Held-back findings (1)' }),
    ).toBeInTheDocument();
    expect(within(drawer).getByText('Sensor drop needs a look')).toBeInTheDocument();
    expect(within(drawer).getByText('Held back')).toBeInTheDocument();
    expect(within(drawer).queryByText('Nothing to review.')).not.toBeInTheDocument();
  });

  it('identifies a held-back assessment even when no findings were computed', async () => {
    useApi.mockReturnValue({
      data: {
        ...DATA,
        vehicles: [
          {
            ...DATA.vehicles[0],
            status: 'HELD_BACK',
            alertsSuppressed: true,
            flags: [],
            flagCount: 0,
          },
        ],
      },
      loading: false,
      refetch: vi.fn(),
    });
    await renderPage();
    const row = rowFor(DATA.vehicles[0].registrationNumber);
    expect(within(row).getByText('Assessment held back')).toBeInTheDocument();
    expect(within(row).getByText('Alerts held back')).toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: 'Details' }));
    expect(
      within(screen.getByRole('dialog')).getByText('No held-back findings in this calculation.'),
    ).toBeInTheDocument();
  });

  it('shows old telemetry as stale in the table and drawer independently of calculation time', async () => {
    const old = {
      ...DATA.vehicles[0],
      coverageFrom: '2026-10-01T00:00:00Z',
      coverageTo: '2026-10-22T00:00:00Z',
      lastComputedAt: '2026-11-09T06:00:00Z',
      freshness: { status: 'STALE', asOf: '2026-10-22T00:00:00Z', ageHours: 438 },
    };
    useApi.mockReturnValue({
      data: { ...DATA, freshness: { staleAfterHours: 48 }, vehicles: [old] },
      loading: false,
      refetch: vi.fn(),
    });
    const view = await renderPage();
    const row = rowFor(old.registrationNumber);
    expect(within(row).getByText('Stale')).toBeInTheDocument();
    expect(within(row).getByText(/Data as of/)).toHaveTextContent('Data as of 22 Oct 2026');
    expect(row.querySelector('time')).toHaveAttribute('dateTime', '2026-10-22T00:00:00.000Z');
    expect(
      screen.getByText(/1 vehicle has stale telemetry; totals include those balances/),
    ).toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: 'Details' }));
    const drawer = screen.getByRole('dialog', { name: `DEF & AdBlue — ${old.registrationNumber}` });
    expect(within(drawer).getByText('Stale')).toBeInTheDocument();
    expect(within(drawer).getByText(/Data as of/)).toHaveTextContent('22 Oct 2026');
    expect(within(drawer).getByText(/Calculated on/)).toHaveTextContent('09 Nov 2026');

    const current = {
      ...old,
      coverageTo: '2026-11-09T00:00:00Z',
      freshness: { status: 'RECENT', asOf: '2026-11-09T00:00:00Z', ageHours: 6 },
    };
    useApi.mockReturnValue({
      data: { ...DATA, vehicles: [current] },
      loading: false,
      refetch: vi.fn(),
    });
    view.rerender(
      <MemoryRouter>
        <DefLedgerPage />
      </MemoryRouter>,
    );
    expect(within(drawer).queryByText('Stale')).not.toBeInTheDocument();
    expect(within(drawer).getByText('Recent')).toBeInTheDocument();
    expect(within(drawer).getByText(/Data as of/)).toHaveTextContent('9 Nov 2026');
  });

  it('does not treat calculation time as a telemetry timestamp when freshness is unknown', async () => {
    useApi.mockReturnValue({
      data: {
        ...DATA,
        vehicles: [
          {
            ...DATA.vehicles[0],
            lastComputedAt: '2026-11-09T06:00:00Z',
            freshness: { status: 'UNKNOWN', asOf: null, ageHours: null },
          },
        ],
      },
      loading: false,
      refetch: vi.fn(),
    });
    await renderPage();
    const row = rowFor(DATA.vehicles[0].registrationNumber);
    expect(within(row).getByText('Freshness unknown')).toBeInTheDocument();
    expect(within(row).getByText('Telemetry date unavailable')).toBeInTheDocument();
    expect(within(row).queryByText(/Data as of/)).not.toBeInTheDocument();
  });
});
