import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VehiclePanelHeader from './VehiclePanelHeader';

const now = {
  registrationNumber: 'WB11L8862',
  identity: { make: 'TATA', model: '4830TC', modelLine: 'LPT 4830', vin: 'MAT566011S3E16394' },
  view: {
    status: 'moving',
    freshness: 'live',
    lastFixAt: '2026-11-02T20:48:00Z',
    hasFix: true,
    hasGpsFix: true,
    ignition: 'ON',
    ageMin: 0,
  },
  readings: { gps: { at: '2026-11-02T20:48:00Z', ageMin: 0, freshness: 'live', satellites: 9 } },
  activity: { kind: 'DRIVING_LOADED' },
  trip: { leg: 'LADEN' },
};

describe('VehiclePanelHeader', () => {
  it('shows the plate, the make and the model', () => {
    render(<VehiclePanelHeader now={now} />);
    expect(screen.getByText('WB11L8862')).toBeInTheDocument();
    expect(screen.getByText(/Tata 4830TC/)).toBeInTheDocument();
  });

  it('shows the VIN so it can be copied', () => {
    render(<VehiclePanelHeader now={now} />);
    expect(screen.getByText('MAT566011S3E16394')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy VIN' })).toBeInTheDocument();
  });

  it('says the status and the leg of the journey', () => {
    render(<VehiclePanelHeader now={now} />);
    expect(screen.getByText('Moving')).toBeInTheDocument();
    expect(screen.getByText(/Loaded run/)).toBeInTheDocument();
  });

  it('never says "In transit"', () => {
    render(<VehiclePanelHeader now={now} />);
    expect(screen.queryByText(/In transit/i)).not.toBeInTheDocument();
  });

  it('says the GPS is live and the engine is on', () => {
    render(<VehiclePanelHeader now={now} />);
    expect(screen.getByText('GPS fix')).toBeInTheDocument();
    expect(screen.getByText('Engine on')).toBeInTheDocument();
  });

  it('says the make is not known rather than guessing', () => {
    render(<VehiclePanelHeader now={{ ...now, identity: { make: null, model: null, vin: null } }} />);
    expect(screen.getByText('Make not known')).toBeInTheDocument();
    expect(screen.getByText('Model not known')).toBeInTheDocument();
  });

  it('hides a model that is only digits', () => {
    render(<VehiclePanelHeader now={{ ...now, identity: { make: 'TATA', model: '5555', vin: null } }} />);
    expect(screen.queryByText('5555')).not.toBeInTheDocument();
  });

  it('offers the re-link when the account is disconnected', () => {
    render(
      <VehiclePanelHeader
        now={now}
        account={{ state: 'NEEDS_RELINK', vendor: 'FLEETEDGE', lastDataAt: '2026-11-01T09:00:00Z' }}
        onOpenAccount={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /Account needs re-link/ })).toBeInTheDocument();
  });

  it('says nothing about the account when it is healthy', () => {
    render(
      <VehiclePanelHeader
        now={now}
        account={{ state: 'HEALTHY', vendor: 'FLEETEDGE', lastDataAt: '2026-11-02T20:48:00Z' }}
      />,
    );
    expect(screen.queryByRole('button', { name: /Account needs re-link/ })).not.toBeInTheDocument();
  });
});
