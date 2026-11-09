import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../mileageApi', () => ({
  MileageApi: { fuelCycles: vi.fn() },
}));

import { MileageApi } from '../mileageApi';
import FuelCyclesList from './FuelCyclesList';

const range = { from: '2026-10-01', to: '2026-11-01' };

const cycle = (extra = {}) => ({
  _id: 'c1',
  registrationNumber: 'WB11J8562',
  open: { source: 'BILL', at: '2026-10-01T04:00:00Z', odo: 100000 },
  close: { source: 'BILL', at: '2026-10-04T04:00:00Z', odo: 101200 },
  km: { odo: 1200 },
  fuel: { bills: 400, ecu: 380, tankDelta: 0 },
  mileage: { tankToTank: 3, ecu: 3.16 },
  coverage: { kmMeasured: 0.92, fuelEcu: 0.5 },
  flags: [],
  status: 'RECONCILED',
  ...extra,
});

const renderList = () =>
  render(
    <MemoryRouter>
      <FuelCyclesList range={range} />
    </MemoryRouter>,
  );

describe('Mileage → the register fuel cycles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MileageApi.fuelCycles.mockResolvedValue({ data: { rows: [cycle()] } });
  });

  it('says where the km/L came from', async () => {
    MileageApi.fuelCycles.mockResolvedValue({
      data: { rows: [cycle({ fullBasis: 'REGISTER_MAIN' })] },
    });
    renderList();

    expect(await screen.findByText('3.00 km/L')).toBeInTheDocument();
    expect(screen.getByText('from register rows')).toBeInTheDocument();
  });

  it('says nothing about the basis on the old backend', async () => {
    const { container } = renderList();

    await screen.findByText('3.00 km/L');
    expect(container.textContent).not.toContain('from slips');
    expect(container.textContent).not.toContain('from register rows');
    expect(container.textContent).not.toContain('undefined');
  });

  it('says why there is no km/L when the fill type was not recorded', async () => {
    MileageApi.fuelCycles.mockResolvedValue({
      data: {
        rows: [
          cycle({
            flags: ['FILL_TYPE_UNKNOWN'],
            mileage: { tankToTank: null, ecu: null },
          }),
        ],
      },
    });
    renderList();

    expect(await screen.findByText('fill type not recorded')).toBeInTheDocument();
  });

  it('says what was not measured, in plain words', async () => {
    MileageApi.fuelCycles.mockResolvedValue({
      data: { rows: [cycle({ flags: ['GAP_NOT_ASSESSED', 'LEDGER_PARTIAL'] })] },
    });
    renderList();

    expect(await screen.findByText('not assessed yet · ledger covers part of this cycle')).toBeInTheDocument();
    expect(screen.queryByText(/GAP_NOT_ASSESSED/)).not.toBeInTheDocument();
  });
});
