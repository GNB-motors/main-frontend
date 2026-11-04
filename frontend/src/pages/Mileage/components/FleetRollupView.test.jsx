import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FleetRollupView from './FleetRollupView';
import { MileageApi } from '../mileageApi';

vi.mock('../mileageApi', () => ({ MileageApi: { rollup: vi.fn() } }));

const range = { from: '2026-10-01', to: '2026-10-30', manufacturer: '' };

const rollup = {
  unit: 'KM_PER_LITRE',
  kmPerLitre: {
    basis: 'BILL_CYCLES_SUM_KM_DIV_SUM_LITRES',
    window: { from: '2026-10-01T18:30:00.000Z', to: '2026-10-31T18:30:00.000Z' },
    fleet: {
      vehicles: 12,
      vehiclesPublished: 10,
      cycles: 87,
      km: 12340,
      litres: 2110.5,
      kmPerL: 5.85,
    },
    ecu: { source: 'ECU_TILES_WITHIN_COUNTED_CYCLE_SPANS', km: 12000, litres: 2100, kmPerL: 5.71 },
    gap: { kmPerL: 0.14, pctOfEcu: 2.5, over: 'Bill minus ECU, both measured over the same counted cycle spans.' },
    ecuUncovered: { km: 340, litres: 10.5, note: 'Some billed driving fell outside the spans the engine covers.' },
    duty: { basis: 'OTSU_ON_ORG_MEDIAN_CYCLE_KM', cutKmPerCycle: 180, trucksDescribed: 9 },
    groups: [
      {
        group: 0,
        label: 'Short-haul duty',
        vehicles: 5,
        vehiclesCounted: 4,
        cycles: 30,
        km: 3000,
        litres: 600,
        kmPerL: 5,
        ranked: false,
        excludeNote: 'Not ranked: this group carries 30 cycles, 3,000 km and 600 L.',
        excludedTrucks: [
          { registrationNumber: 'WB11L8863', reason: 'no completed fill-to-full cycle in this window' },
        ],
      },
      {
        group: 1,
        label: 'Long-haul duty',
        vehicles: 7,
        vehiclesCounted: 6,
        cycles: 57,
        km: 9340,
        litres: 1510.5,
        kmPerL: 6.18,
        ranked: true,
        excludeNote: null,
        excludedTrucks: [],
      },
    ],
    ranking: [
      {
        rank: 1,
        dutyGroup: 1,
        registrationNumber: 'WB11L8862',
        model: 'Tata 407',
        cycles: 12,
        km: 4000,
        litres: 640,
        kmPerL: 6.25,
        expectedKmPerL: 6,
        expectedBasis: 'SHRUNK_TO_MODEL_POOLED',
        variancePct: 4.2,
      },
    ],
    withheld: [
      {
        registrationNumber: 'WB11L8863',
        dutyGroup: 0,
        cycles: 1,
        km: 120,
        litres: 30,
        reason: '1 usable cycle against this group’s typical 4',
      },
    ],
    learned: {
      basis: 'LEARNED_PER_DUTY_GROUP_FROM_ORG_DISTRIBUTION',
      groups: {
        0: { minCycles: 4, minKm: 400, minLitres: 90, trucks: 5, source: 'STORED' },
        1: { minCycles: null, minKm: null, minLitres: null, trucks: 0, source: 'NONE' },
      },
      learnedAt: '2026-11-01T00:00:00.000Z',
      source: 'STORED',
    },
  },
};

const renderView = (props = {}) => render(<FleetRollupView range={range} {...props} />);

describe('FleetRollupView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows one km/L for the fleet and the engine figure beside it', async () => {
    MileageApi.rollup.mockResolvedValue(rollup);
    renderView();
    expect(await screen.findByText('5.85 km/L')).toBeInTheDocument();
    expect(screen.getByText('5.71 km/L')).toBeInTheDocument();
    expect(screen.getByText('+0.14 km/L')).toBeInTheDocument();
    expect(MileageApi.rollup).toHaveBeenCalledWith(range, expect.anything());
  });

  it('shows the truck ranking with what each truck should be doing', async () => {
    MileageApi.rollup.mockResolvedValue(rollup);
    renderView();
    expect(await screen.findByText('WB11L8862')).toBeInTheDocument();
    expect(screen.getByText('6.25 km/L')).toBeInTheDocument();
    expect(screen.getByText('+4.2%')).toBeInTheDocument();
  });

  it('keeps the reason a truck is held back', async () => {
    MileageApi.rollup.mockResolvedValue(rollup);
    renderView();
    expect(await screen.findByText(/1 usable cycle against this group/)).toBeInTheDocument();
  });

  it('says why there is no fleet figure instead of showing a zero', async () => {
    MileageApi.rollup.mockResolvedValue({
      kmPerLitre: {
        fleet: { vehicles: 0, vehiclesPublished: 0, cycles: 0, km: 0, litres: 0, kmPerL: null },
        ecu: { kmPerL: null },
        gap: { kmPerL: null },
        groups: [],
        ranking: [],
        withheld: [],
      },
    });
    renderView();
    expect(await screen.findByText(/no completed fill-to-full cycle fell in this window/i)).toBeInTheDocument();
    expect(screen.queryByText('0.00 km/L')).not.toBeInTheDocument();
  });

  it('says the read failed and offers a retry', async () => {
    MileageApi.rollup.mockRejectedValue({ status: 500 });
    renderView();
    expect(await screen.findByText(/couldn.t load the fleet mileage/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
