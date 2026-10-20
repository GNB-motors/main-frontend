import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import VehicleDetailPanel from './VehicleDetailPanel';

vi.mock('./DestinationIntentSection.jsx', () => ({
  default: ({ registrationNumber }) => <p>intent for {String(registrationNumber)}</p>,
}));
vi.mock('./RecordedPathSection.jsx', () => ({ default: () => null }));
vi.mock('./VehicleInfoSection.jsx', () => ({ default: () => null }));
vi.mock('./DriverAssignmentSection.jsx', () => ({ default: () => null }));
vi.mock('./TelematicsDiagnosticsSection.jsx', () => ({ default: () => null }));

describe('VehicleDetailPanel', () => {
  // The rows built for Live Tracking have `plate`, not `registrationNumber`, so the
  // destination prediction used to be looked up for `undefined`.
  it('asks for the selected vehicle’s destination by its plate', () => {
    render(
      <VehicleDetailPanel
        selectedVehicle={{
          id: 'live-WB01AB1234',
          plate: 'WB 01 AB 1234',
          status: 'moving',
          ago: 2,
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
        trailPoints={[]}
        trailKm={0}
        selectedDriver={null}
      />,
    );
    expect(screen.getByText('intent for WB 01 AB 1234')).toBeInTheDocument();
  });
});
