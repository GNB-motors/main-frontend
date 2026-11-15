import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/performance', () => ({
  default: {
    vehicles: vi.fn(),
    vehicle: vi.fn(),
    drivers: vi.fn(),
    driver: vi.fn(),
    leaderboards: vi.fn(),
    boards: vi.fn(),
  },
}));

import PerformanceApi from '../../api/performance';
import PerformancePage from './PerformancePage';

const cell = (overrides) => ({
  value: null,
  unit: null,
  source: 'measured',
  uncertainty: null,
  reason: null,
  ...overrides,
});

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <PerformancePage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  PerformanceApi.vehicles.mockResolvedValue({ vehicles: [] });
  PerformanceApi.vehicle.mockResolvedValue({});
  PerformanceApi.drivers.mockResolvedValue({ drivers: [] });
  PerformanceApi.driver.mockResolvedValue({});
  PerformanceApi.leaderboards.mockResolvedValue({ boards: [] });
  PerformanceApi.boards.mockResolvedValue({ boards: [] });
});

describe('Performance page', () => {
  it('shows the vehicles tab with the source of every number', async () => {
    PerformanceApi.vehicles.mockResolvedValue({
      vehicles: [
        {
          vehicleId: 'veh-1',
          registration: 'SCRUBPL00001',
          provider: 'IALERT',
          kmPerL: cell({ value: 3.42, unit: 'km/L' }),
          idlePct: cell({ value: null, source: 'not_comparable', reason: 'no comparable segment' }),
          topGearPct: cell({ value: 61, unit: '%', source: 'estimated', uncertainty: 4 }),
          overRevPct: cell({ value: 2, unit: '%' }),
          healthFindings: 2,
        },
      ],
    });
    PerformanceApi.vehicle.mockResolvedValue({
      vehicle: { vehicleId: 'veh-1', registration: 'SCRUBPL00001', provider: 'IALERT' },
      gearRpm: {
        gearPct: { '3rd': cell({ value: 55, unit: '%', source: 'estimated', uncertainty: 3 }) },
      },
      health: [],
      efficiencyDrift: null,
      harshEvents: [],
    });

    renderAt('/performance?tab=vehicles');

    expect(await screen.findAllByText('SCRUBPL00001')).not.toHaveLength(0);
    expect(screen.getByText('Fleet')).toBeInTheDocument();
    expect(screen.getAllByText('measured').length).toBeGreaterThan(0);
    expect(screen.getAllByText('estimated').length).toBeGreaterThan(0);
    expect(screen.getAllByText('not comparable').length).toBeGreaterThan(0);
    expect(screen.getByText('no comparable segment')).toBeInTheDocument();
  });

  it('opens an iALERT-only truck, which has no platform vehicle id, by its vehicleKey', async () => {
    PerformanceApi.vehicles.mockResolvedValue({
      vehicles: [
        {
          vehicleKey: 'ialert:abc123',
          vehicleId: null,
          registration: 'SCRUBPL00002',
          provider: 'IALERT',
          kmPerL: cell({ value: 3.1, unit: 'km/L' }),
          idlePct: cell({ value: 12, unit: '%' }),
          topGearPct: cell({ value: 40, unit: '%' }),
          overRevPct: cell({ value: 0, unit: '%' }),
          healthFindings: 0,
        },
      ],
    });
    PerformanceApi.vehicle.mockResolvedValue({
      vehicle: { vehicleKey: 'ialert:abc123', vehicleId: null, registration: 'SCRUBPL00002' },
      gearRpm: null,
      health: [],
      efficiencyDrift: null,
      harshEvents: [],
    });

    renderAt('/performance?tab=vehicles');

    expect(await screen.findAllByText('SCRUBPL00002')).not.toHaveLength(0);
    await waitFor(() =>
      expect(PerformanceApi.vehicle).toHaveBeenCalledWith('ialert:abc123', {}, expect.anything()),
    );
  });

  it('shows an empty fleet as a directive, not as a fake zero', async () => {
    renderAt('/performance?tab=vehicles');
    expect(await screen.findByText('No vehicles in this window')).toBeInTheDocument();
  });

  it('shows the drivers tab with the Driver DNA behind each score', async () => {
    PerformanceApi.drivers.mockResolvedValue({
      drivers: [
        {
          driverId: 'drv-1',
          name: 'Asha Roy',
          vehicles: ['SCRUBPL00001'],
          dnaScore: cell({ value: 88 }),
          harshPer100Km: cell({
            value: null,
            source: 'not_comparable',
            reason: 'needs a per-truck gear estimate',
          }),
          idlePct: cell({ value: 4, unit: '%', source: 'vendor' }),
        },
      ],
    });
    PerformanceApi.driver.mockResolvedValue({
      dna: {
        grade: 'A',
        drivingScore: cell({ value: 88 }),
        smoothBraking: cell({
          value: null,
          source: 'not_comparable',
          reason: 'needs a per-truck gear estimate',
        }),
      },
    });

    renderAt('/performance?tab=drivers');

    expect(await screen.findAllByText('Asha Roy')).not.toHaveLength(0);
    expect(screen.getByText('Driver DNA')).toBeInTheDocument();
    expect(screen.getAllByText('vendor').length).toBeGreaterThan(0);
    expect(screen.getAllByText('needs a per-truck gear estimate').length).toBeGreaterThan(0);
  });

  it('shows an empty driver list as a directive', async () => {
    renderAt('/performance?tab=drivers');
    expect(await screen.findByText('No drivers in this window')).toBeInTheDocument();
  });

  it('shows the leaderboards tab and keeps unmeasured rows unranked', async () => {
    PerformanceApi.boards.mockResolvedValue({
      boards: [
        {
          key: 'FUEL_VS_EXPECTED',
          title: 'km/L vs expected for this duty',
          unit: 'km/L',
          direction: 'higher',
          measures: 'THE TRUCK MOSTLY',
          groups: [
            {
              dutyGroup: 'D1',
              rankedCount: 1,
              floor: null,
              rows: [
                {
                  key: 'drv-1#D1',
                  driverId: 'drv-1',
                  driverName: 'SCRUBPL00001',
                  dutyGroup: 'D1',
                  value: 3.42,
                  expectedValue: 3.28,
                  expectedPeers: 3,
                  expectedExcludesSelf: true,
                  vsExpectedPct: 4.3,
                  rank: 1,
                  position: 1,
                  rankNote: null,
                  sample: {
                    trips: 4,
                    cycles: 2,
                    vehicles: 1,
                    observedDays: 10,
                    windowDays: 30,
                    coveragePct: 50,
                    km: 1200,
                    observations: 2,
                  },
                  vehicleCoverage: [],
                },
                {
                  key: 'drv-2#D1',
                  driverId: 'drv-2',
                  driverName: 'SCRUBPL00002',
                  dutyGroup: 'D1',
                  value: null,
                  expectedValue: 3.2,
                  expectedPeers: 3,
                  expectedExcludesSelf: true,
                  vsExpectedPct: null,
                  rank: null,
                  position: 2,
                  rankNote: 'Nothing was measured for this row in this window.',
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
    });

    renderAt('/performance?tab=leaderboards');

    await waitFor(() =>
      expect(screen.getAllByText('km/L vs expected for this duty').length).toBeGreaterThan(0),
    );
    expect(screen.getByText('SCRUBPL00001')).toBeInTheDocument();
    expect(screen.getByText('unranked')).toBeInTheDocument();
    expect(
      screen.getByText('Nothing was measured for this row in this window.'),
    ).toBeInTheDocument();
  });

  it('shows an empty leaderboard as a directive', async () => {
    renderAt('/performance?tab=leaderboards');
    expect(await screen.findByText('No boards in this window')).toBeInTheDocument();
  });

  it('moves between the tabs', async () => {
    renderAt('/performance');
    fireEvent.click(screen.getByRole('tab', { name: 'Drivers' }));
    expect(await screen.findByText('Driver DNA')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Leaderboards' }));
    expect(await screen.findByText('No boards in this window')).toBeInTheDocument();
  });
});
