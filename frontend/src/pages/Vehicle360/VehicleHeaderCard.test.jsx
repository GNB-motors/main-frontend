import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FleetDataService from '../../services/FleetDataService';
import VehicleHeaderCard from './VehicleHeaderCard';

vi.mock('../../services/FleetDataService', () => ({
  default: {
    getVehicleOverview: vi.fn(),
    getVehicleTelemetry: vi.fn(),
    getTyreStatus: vi.fn(),
  },
}));
vi.mock('./VehicleMiniMap', () => ({ default: () => <div>Vehicle map</div> }));
vi.mock('../Compliance/OpenChallanBadge', () => ({ default: () => null }));
vi.mock('../Mileage/AddBillPhotoDialog', () => ({
  default: ({ onConfirmed }) => (
    <button type="button" onClick={onConfirmed}>
      Confirm fuel log
    </button>
  ),
}));

const shared = { fuel: { litres: 10, percent: 50, at: null }, def: null };

describe('the header card with a shared overview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FleetDataService.getVehicleOverview.mockResolvedValue({});
  });

  // With a shared overview the card does not read it: the page's own refetch
  // is what refreshes the fuel, DEF and odometer tiles after a fuel log.
  it('refreshes through the page when the overview is shared', async () => {
    const refreshOverview = vi.fn();
    render(
      <MemoryRouter>
        <VehicleHeaderCard
          reg="WB11T0662"
          profile={{ fleetMaster: {} }}
          onGoTab={vi.fn()}
          overview={shared}
          refreshOverview={refreshOverview}
        />
      </MemoryRouter>,
    );
    await waitFor(() => expect(FleetDataService.getVehicleOverview).not.toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Log fuel' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm fuel log' }));

    expect(refreshOverview).toHaveBeenCalled();
  });

  it('refetches its own overview when there is no shared one', async () => {
    render(
      <MemoryRouter>
        <VehicleHeaderCard reg="WB11T0662" profile={{ fleetMaster: {} }} onGoTab={vi.fn()} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(FleetDataService.getVehicleOverview).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Log fuel' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm fuel log' }));

    await waitFor(() => expect(FleetDataService.getVehicleOverview).toHaveBeenCalledTimes(2));
  });
});
