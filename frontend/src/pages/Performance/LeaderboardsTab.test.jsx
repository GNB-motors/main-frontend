import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import LeaderboardsTab from './LeaderboardsTab';
import PerformanceApi from '../../api/performance';

vi.mock('../../api/performance', () => ({
  default: {
    boards: vi.fn(),
  },
}));

const BOARDS = {
  window: { from: '2026-10-05T00:00:00.000Z', to: '2026-11-03T00:00:00.000Z', days: 30 },
  dataAsOf: '2026-11-03T00:00:00.000Z',
  boards: [
    {
      key: 'FUEL_VS_EXPECTED',
      title: 'km/L vs expected for this duty',
      unit: 'km/L',
      direction: 'higher',
      measures: 'THE TRUCK MOSTLY',
      doesNotMeasure: 'Fuel is measured at the tank and the engine.',
      numerator: 'fuelKm',
      denominator: 'litres',
      groups: [
        {
          dutyGroup: 'D1',
          rankedCount: 1,
          floor: { minObservations: 4, minKm: 1200, source: 'MEDIAN_OF_THIS_DUTY_GROUPS_OWN_ROWS' },
          rows: [
            {
              key: 'drv-1#D1',
              driverId: 'drv-1',
              driverName: 'Ramesh Yadav',
              dutyGroup: 'D1',
              value: 4.12,
              expectedValue: 3.95,
              expectedExcludesSelf: true,
              expectedPeers: 3,
              vsExpectedPct: 4.3,
              interval: { lo: 60, hi: 70 },
              rank: 1,
              position: 1,
              rankNote: null,
              sample: {
                trips: 12,
                cycles: 6,
                vehicles: 1,
                observedDays: 20,
                windowDays: 30,
                coveragePct: 66.7,
                km: 4200,
                observations: 6,
              },
              vehicleCoverage: [
                {
                  vehicleId: 'veh-1',
                  vehicleNumber: 'WB01AB1234',
                  dutyGroup: 'D1',
                  km: 4200,
                  trips: 12,
                  observedDays: 20,
                  ecuBillBiasPct: 2.4,
                  ecuBillBiasSamples: 8,
                },
              ],
            },
            {
              key: 'drv-2#D1',
              driverId: 'drv-2',
              driverName: 'Sita Devi',
              dutyGroup: 'D1',
              value: null,
              expectedValue: 3.9,
              expectedExcludesSelf: true,
              expectedPeers: 3,
              vsExpectedPct: null,
              interval: null,
              rank: null,
              position: 2,
              rankNote:
                'Nothing was measured for this row in this window — there is no number to rank.',
              sample: {
                trips: 0,
                cycles: 0,
                vehicles: 0,
                observedDays: 0,
                windowDays: 30,
                coveragePct: 0,
                km: 0,
                observations: 0,
              },
              vehicleCoverage: [],
            },
          ],
        },
      ],
    },
  ],
  meta: {
    duty: {
      cutKmPerCycle: 640,
      rule: 'Otsu maximum between-class variance over each truck median fill-to-fill distance.',
      method: 'LEARNED_DUTY_FROM_OWN_CYCLES',
      vehiclesGrouped: 12,
    },
    ranking:
      'A rank is awarded only where this row’s 95% interval does not overlap the row above it.',
    rankRuleSource: 'app/modules/scorecard/scorecard.service.js — componentInterval',
    biasScope: 'PER_VEHICLE_ONLY',
    behaviourSource: 'BEHAVIOURDAY',
    supersedes: 'GET /api/driver-leaderboard',
  },
};

const renderTab = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LeaderboardsTab />
    </MemoryRouter>,
  );

const IDLE_BOARD = {
  key: 'IDLE_PCT',
  title: 'Idle share of engine-on time',
  unit: '%',
  direction: 'lower',
  measures: 'VEHICLE AND DRIVER',
  doesNotMeasure: 'Idle at a loading point counts too.',
  groups: [],
};

describe('LeaderboardsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PerformanceApi.boards.mockResolvedValue(BOARDS);
  });

  it('shows the board, what it measures and what it does not measure', async () => {
    renderTab();

    await waitFor(() => expect(screen.getByText('km/L vs expected for this duty')).toBeTruthy());
    expect(screen.getByText('Measures: the truck mostly')).toBeTruthy();
    expect(screen.getByText('Fuel is measured at the tank and the engine.')).toBeTruthy();
  });

  it('keeps the method notes closed until asked, then shows them without codes', async () => {
    renderTab();

    const toggle = await screen.findByRole('button', { name: /How these boards are worked out/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Learned duty from own cycles')).toBeNull();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Learned duty from own cycles')).toBeTruthy();
    expect(screen.queryByText('LEARNED_DUTY_FROM_OWN_CYCLES')).toBeNull();
  });

  it('shows the value, the expected pool beside it, and the rank', async () => {
    renderTab();

    await waitFor(() => expect(screen.getByText('Ramesh Yadav')).toBeTruthy());
    expect(screen.getByText('4.12 km/L')).toBeTruthy();
    expect(screen.getByText('3.95 km/L')).toBeTruthy();
    expect(screen.getByText('+4.3%')).toBeTruthy();
    expect(screen.getByText('#1')).toBeTruthy();
    expect(
      screen.getByText(
        /Expected value from a pool of 3 drivers, leaving out the driver being compared\./,
      ),
    ).toBeTruthy();
    expect(screen.queryByText('pool of 3, this row excluded')).toBeNull();
  });

  it('leaves an unmeasured row unranked and says why', async () => {
    renderTab();

    await waitFor(() => expect(screen.getByText('Sita Devi')).toBeTruthy());
    expect(screen.getByText('Unranked')).toBeTruthy();
    expect(screen.getByText(/Nothing was measured for this row/)).toBeTruthy();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.queryByText('0 km/L')).toBeNull();
  });

  it('says in the briefing how many drivers earned a rank', async () => {
    renderTab();

    const briefing = await screen.findByRole('region', { name: 'Leaderboards read' });
    expect(briefing.textContent).toContain('1 of 2 drivers earned a rank on at least one board.');
  });

  it('says how many trips were not measured', async () => {
    PerformanceApi.boards.mockResolvedValue({
      ...BOARDS,
      meta: { ...BOARDS.meta, tripsWithUnknownKm: 7 },
    });
    renderTab();

    await waitFor(() => expect(screen.getByText('7 trips not measured.')).toBeTruthy());
  });

  it('says nothing about unmeasured trips when the server did not count them', async () => {
    renderTab();

    await waitFor(() => expect(screen.getByText('km/L vs expected for this duty')).toBeTruthy());
    expect(screen.queryByText(/trips not measured/)).toBeNull();
  });

  it('keeps raw formula fields out of the board', async () => {
    renderTab();

    expect(await screen.findByText('km/L vs expected for this duty')).toBeInTheDocument();
    expect(screen.queryByText(/Σ|fuelKm ÷/)).not.toBeInTheDocument();
  });

  it('shows one board at a time behind a tab per board', async () => {
    PerformanceApi.boards.mockResolvedValue({ ...BOARDS, boards: [...BOARDS.boards, IDLE_BOARD] });
    renderTab();

    const tabs = await screen.findByRole('tablist', { name: 'Boards' });
    expect(screen.getByRole('tab', { name: /Mileage/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('km/L vs expected for this duty')).toBeTruthy();
    expect(screen.queryByText('Idle share of engine-on time')).toBeNull();

    fireEvent.click(within(tabs).getByRole('tab', { name: 'Idling' }));

    expect(screen.getByText('Idle share of engine-on time')).toBeTruthy();
    expect(screen.queryByText('km/L vs expected for this duty')).toBeNull();
  });

  it('opens the board the link names', async () => {
    PerformanceApi.boards.mockResolvedValue({ ...BOARDS, boards: [...BOARDS.boards, IDLE_BOARD] });
    renderTab('/?board=IDLE_PCT');

    await screen.findByText('Idle share of engine-on time');
    expect(screen.getByRole('tab', { name: 'Idling' })).toHaveAttribute('aria-selected', 'true');
  });
});
