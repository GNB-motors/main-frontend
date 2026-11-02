import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';
import VehicleDetailPanel from './VehicleDetailPanel';

vi.mock('./DestinationIntentSection.jsx', () => ({
  default: ({ registrationNumber }) => <p>intent for {String(registrationNumber)}</p>,
}));
vi.mock('./VehicleInfoSection.jsx', () => ({ default: () => null }));
vi.mock('./DriverAssignmentSection.jsx', () => ({ default: () => null }));
vi.mock('./TelematicsDiagnosticsSection.jsx', () => ({ default: () => null }));
vi.mock('../../services/PlaceService', () => ({
  resolvePlace: vi.fn().mockResolvedValue({ label: 'Near Dankuni', sub: 'West Bengal' }),
}));

describe('VehicleDetailPanel', () => {
  // The rows built for Live Tracking have `plate`, not `registrationNumber`, so the
  // destination prediction used to be looked up for `undefined`.
  it('asks for the selected vehicle’s destination by its plate', async () => {
    render(
      <VehicleDetailPanel
        selectedVehicle={{
          id: 'live-WB01AB1234',
          plate: 'WB 01 AB 1234',
          status: 'moving',
          ago: 2,
          model: 'Signa 5530',
          vin: 'MAT123456789',
          hasFix: true,
          lat: 22.67,
          lng: 88.3,
        }}
        setSelectedId={() => {}}
        exitReplay={() => {}}
        showToast={() => {}}
        mapRef={{ current: null }}
        isTrailVisible={false}
        replayState={{ on: false }}
        trailLoading={false}
        toggleTrail={() => {}}
        enterReplay={() => {}}
        shareCreating={false}
        handleShareVehicle={() => {}}
        selectedDriver={null}
      />,
    );
    expect(screen.getByText('intent for WB 01 AB 1234')).toBeInTheDocument();
    expect(await screen.findByText('Near Dankuni')).toBeInTheDocument();
  });

  it('labels the vehicle identifiers, resolves the location and omits Focus', async () => {
    render(
      <VehicleDetailPanel
        selectedVehicle={{
          plate: 'WB01',
          model: 'Signa',
          vin: 'MAT123',
          hasFix: true,
          lat: 22.67,
          lng: 88.3,
        }}
        replayState={{ on: false }}
      />,
    );
    expect(screen.getByText('Model:')).toBeInTheDocument();
    expect(screen.getByText('VIN:')).toBeInTheDocument();
    expect(await screen.findByText('Near Dankuni')).toBeInTheDocument();
    expect(screen.queryByText('22.6700, 88.3000')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Focus' })).not.toBeInTheDocument();
  });

  it('shows GPS and ignition in the header, with DEF and Odometer in the metric grid', () => {
    const { container } = render(
      <VehicleDetailPanel
        selectedVehicle={{
          plate: 'BR44GB1162',
          hasFix: true,
          hasGpsFix: true,
          ignition: 'ON',
          odo: 123456,
          fuel: 32,
          fuelUnit: 'litres',
          defLevel: 80,
          defUnit: 'percent',
        }}
        replayState={{ on: false }}
      />,
    );
    expect(within(container.querySelector('.dtop')).getByText('GPS fix')).toBeInTheDocument();
    expect(within(container.querySelector('.dtop')).getByText('Ignition ON')).toBeInTheDocument();
    const metrics = within(container.querySelector('.metrics'));
    expect(metrics.getByText('Odometer')).toBeInTheDocument();
    expect(metrics.getByText('1,23,456 km')).toBeInTheDocument();
    expect(metrics.getByText('DEF')).toBeInTheDocument();
    expect(metrics.getByText('80%')).toBeInTheDocument();
    expect(metrics.queryByText('GPS')).not.toBeInTheDocument();
    expect(metrics.queryByText('Ignition')).not.toBeInTheDocument();
  });
});
