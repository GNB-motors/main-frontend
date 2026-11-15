import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VehicleAccountBanner from './VehicleAccountBanner';

describe('VehicleAccountBanner', () => {
  it('says which account is disconnected and for how long', () => {
    render(
      <MemoryRouter>
        <VehicleAccountBanner
          account={{
            state: 'NEEDS_RELINK',
            vendor: 'FLEETEDGE',
            lastDataAt: '2026-11-01T09:00:00Z',
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/FleetEdge account is disconnected/)).toBeInTheDocument();
  });

  it('offers the one button that fixes it', () => {
    render(
      <MemoryRouter>
        <VehicleAccountBanner
          account={{ state: 'NEEDS_RELINK', vendor: 'FLEETEDGE', lastDataAt: '2026-11-01T09:00:00Z' }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Reconnect' })).toHaveAttribute(
      'href',
      '/settings/fleetedge-accounts',
    );
  });

  it('says nothing when the account is healthy', () => {
    const { container } = render(
      <MemoryRouter>
        <VehicleAccountBanner
          account={{ state: 'HEALTHY', vendor: 'FLEETEDGE', lastDataAt: '2026-11-02T20:48:00Z' }}
        />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('says nothing when there is no account', () => {
    const { container } = render(
      <MemoryRouter>
        <VehicleAccountBanner account={null} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
