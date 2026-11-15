import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
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
    ranking: 'A rank is awarded only where this row’s 95% interval does not overlap the row above it.',
    rankRuleSource: 'app/modules/scorecard/scorecard.service.js — componentInterval',
    biasScope: 'PER_VEHICLE_ONLY',
    behaviourSource: 'BEHAVIOURDAY',
    supersedes: 'GET /api/driver-leaderboard',
  },
};

describe('LeaderboardsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PerformanceApi.boards.mockResolvedValue(BOARDS);
  });

  it('shows the board, what it measures and what it does not measure', async () => {
    render(<LeaderboardsTab />);

    await waitFor(() =>
      expect(screen.getByText('km/L vs expected for this duty')).toBeTruthy(),
    );
    expect(screen.getByText('Measures: THE TRUCK MOSTLY')).toBeTruthy();
    expect(screen.getByText('Fuel is measured at the tank and the engine.')).toBeTruthy();
    expect(screen.getByText('LEARNED_DUTY_FROM_OWN_CYCLES')).toBeTruthy();
  });

  it('shows the value, the expected pool beside it, and the rank', async () => {
    render(<LeaderboardsTab />);

    await waitFor(() => expect(screen.getByText('Ramesh Yadav')).toBeTruthy());
    expect(screen.getByText('4.12 km/L')).toBeTruthy();
    expect(screen.getByText('3.95 km/L')).toBeTruthy();
    expect(screen.getByText('+4.3%')).toBeTruthy();
    expect(screen.getByText('#1')).toBeTruthy();
    expect(screen.getAllByText(/pool of 3, this row excluded/).length).toBeGreaterThan(0);
  });

  it('leaves an unmeasured row unranked and says why', async () => {
    render(<LeaderboardsTab />);

    await waitFor(() => expect(screen.getByText('Sita Devi')).toBeTruthy());
    expect(screen.getByText('unranked')).toBeTruthy();
    expect(screen.getByText(/Nothing was measured for this row/)).toBeTruthy();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.queryByText('0 km/L')).toBeNull();
  });

  it('says how many trips were not measured', async () => {
    PerformanceApi.boards.mockResolvedValue({
      ...BOARDS,
      meta: { ...BOARDS.meta, tripsWithUnknownKm: 7 },
    });
    render(<LeaderboardsTab />);

    await waitFor(() => expect(screen.getByText('7 trips not measured.')).toBeTruthy());
  });

  it('says nothing about unmeasured trips when the server did not count them', async () => {
    render(<LeaderboardsTab />);

    await waitFor(() => expect(screen.getByText('km/L vs expected for this duty')).toBeTruthy());
    expect(screen.queryByText(/trips not measured/)).toBeNull();
  });

  it('writes a dash for a side of the sum the server did not name', async () => {
    PerformanceApi.boards.mockResolvedValue({
      ...BOARDS,
      boards: BOARDS.boards.map((board) => ({ ...board, numerator: null })),
    });
    render(<LeaderboardsTab />);

    await waitFor(() => expect(screen.getByText('Σ — ÷ Σ litres')).toBeTruthy());
  });
});
