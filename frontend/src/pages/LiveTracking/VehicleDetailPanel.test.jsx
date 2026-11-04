import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VehicleDetailPanel from './VehicleDetailPanel';

const { getWhereNext } = vi.hoisted(() => ({
  getWhereNext: vi.fn(),
}));

vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getWhereNext },
}));

vi.mock('./VehicleLayerToggles.jsx', () => ({ default: () => null }));

const releaseVehicle = {
  id: 'live-WB01AB1234',
  plate: 'WB 01 AB 1234',
  status: 'moving',
  ago: 2,
  manufacturer: 'Tata',
  model: 'Signa 5530',
  vin: 'MAT123456789',
  hasFix: true,
  hasGpsFix: true,
  ignition: 'ON',
  odo: 123456,
  fuel: 32,
  defLevel: 80,
  lat: 22.67,
  lng: 88.3,
};

function renderPanel(vehicle = releaseVehicle) {
  return render(
    <MemoryRouter>
      <VehicleDetailPanel
        selectedVehicle={vehicle}
        setSelectedId={() => {}}
        exitReplay={() => {}}
        isTrailVisible={false}
        shareCreating={false}
        handleShareVehicle={() => {}}
        selectedDriver={null}
      />
    </MemoryRouter>,
  );
}

describe('VehicleDetailPanel', () => {
  beforeEach(() => {
    getWhereNext.mockReset();
    // There is no `/now` endpoint to wait for any more: the panel reads the
    // live position row.
    getWhereNext.mockRejectedValue(Object.assign(new Error('Not found'), { status: 404 }));
  });

  it('shows the truck and what it is doing now', () => {
    renderPanel();
    expect(screen.getByText('WB 01 AB 1234')).toBeInTheDocument();
    // The Now card says what the position row proves.
    expect(screen.getByRole('heading', { name: 'Now · Moving' })).toBeInTheDocument();
    expect(screen.queryByText(/once it reports/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Not enough driving/)).not.toBeInTheDocument();
  });

  it('labels the vehicle identifiers in the details card', () => {
    renderPanel();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Signa 5530')).toBeInTheDocument();
    expect(screen.getByText('VIN')).toBeInTheDocument();
    // The VIN is in the header too, so it can be copied without scrolling.
    expect(screen.getAllByText('MAT123456789').length).toBeGreaterThan(0);
  });

  it('shows the fuel, DEF, odometer and speed, each with its own reading', () => {
    renderPanel();
    expect(screen.getByText('Fuel')).toBeInTheDocument();
    expect(screen.getByText('32 L')).toBeInTheDocument();
    expect(screen.getByText('DEF')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Odometer')).toBeInTheDocument();
    expect(screen.getByText('1,23,456 km')).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();
  });

  it('says the GPS is off when there is no fix', () => {
    renderPanel({ ...releaseVehicle, hasGpsFix: false, hasFix: false });
    expect(screen.getByText('No GPS position')).toBeInTheDocument();
  });

  it('says the engine state when it is known', () => {
    renderPanel();
    expect(screen.getByText('Engine on')).toBeInTheDocument();
  });

  it('never shows a zero for a value it does not have', () => {
    renderPanel({ ...releaseVehicle, fuel: null, defLevel: null, odo: null });
    expect(screen.getByText(/Fuel, DEF, odometer are not sent/)).toBeInTheDocument();
    expect(screen.queryByText('0 L')).not.toBeInTheDocument();
  });

  it('has no Focus button', () => {
    renderPanel();
    expect(screen.queryByRole('button', { name: 'Focus' })).not.toBeInTheDocument();
  });

  it('offers Track and Share', () => {
    renderPanel();
    expect(screen.getByRole('link', { name: /Track/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Share/ })).toBeInTheDocument();
  });

  it('links Track at the truck’s own history', () => {
    renderPanel();
    const link = screen.getByRole('link', { name: /Track/ });
    expect(link.getAttribute('href')).toContain('v=WB+01+AB+1234');
    expect(link.getAttribute('href')).toContain('from=');
  });
});
