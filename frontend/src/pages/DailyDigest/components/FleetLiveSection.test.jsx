import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FleetLiveSection from './FleetLiveSection';

vi.mock('./FleetOverviewMap', () => ({
  default: ({ vehicles, selectedId, onSelect }) => (
    <div data-testid="fleet-map">
      <span>
        {vehicles.length} markers · {selectedId || 'none selected'}
      </span>
      <button onClick={() => onSelect('v1')}>Select map marker</button>
    </div>
  ),
}));

const vehicles = [
  {
    id: 'v1',
    plate: 'BR44GB1162',
    status: 'moving',
    hasFix: true,
    lat: 25.56,
    lng: 83.97,
    area: 'Buxar',
    lastFixAt: '2026-11-04T10:00:00Z',
    speed: 40,
  },
  { id: 'v2', plate: 'WB11F0162', status: 'offline', hasFix: false, area: null },
];
const trips = {
  loading: false,
  data: {
    total: 100,
    items: [
      {
        _id: 'new-trip',
        registrationNumber: 'BR 44 GB 1162',
        pickup: { name: 'New plant' },
        drop: { name: 'Kolkata' },
      },
      { _id: 'old-trip', registrationNumber: 'BR44GB1162', pickup: { name: 'Old plant' } },
    ],
  },
};

describe('fleet overview live operations', () => {
  it('shares selection between map and list, using the latest open trip', async () => {
    render(
      <MemoryRouter>
        <FleetLiveSection fleet={{ vehicles }} live={{ refresh: vi.fn() }} trips={trips} />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('fleet-map')).toBeInTheDocument();
    expect(screen.getByText('New plant → Kolkata')).toBeInTheDocument();
    expect(screen.queryByText(/Old plant/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select map marker' }));
    expect(screen.getByRole('link', { name: /Open trip/ })).toHaveAttribute(
      'href',
      '/auto-trips/new-trip',
    );
    expect(screen.getByText(/Routes from the latest 2 open trips/)).toBeInTheDocument();
  });

  it('filters list and map together and never plots a truck without a GPS position', async () => {
    render(
      <MemoryRouter>
        <FleetLiveSection fleet={{ vehicles }} live={{ refresh: vi.fn() }} trips={trips} />
      </MemoryRouter>,
    );
    expect(await screen.findByText('1 markers · none selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Offline' }));
    expect(screen.getByText('WB11F0162')).toBeInTheDocument();
    expect(screen.queryByText('BR44GB1162')).not.toBeInTheDocument();
    expect(screen.getByText('No positions to display')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Search fleet vehicles'), {
      target: { value: 'not-in-fleet' },
    });
    expect(screen.getByText('No vehicles match this view.')).toBeInTheDocument();
  });
});
