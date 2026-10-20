import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./ialertFleetApi.js', () => ({ fetchIalertVehicles: vi.fn() }));
vi.mock('../../services/PlaceService', () => ({
  resolvePlace: vi.fn(async () => ({ label: 'Howrah', sub: 'West Bengal' })),
}));

import { fetchIalertVehicles } from './ialertFleetApi.js';
import IalertFleetPage from './IalertFleetPage.jsx';

const recent = new Date(Date.now() - 5 * 60000).toISOString();
const since = new Date(Date.now() - (11 * 60 + 10) * 60000).toISOString();

describe('IalertFleetPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows each vehicle with its live status, ignition and fleet link', async () => {
    fetchIalertVehicles.mockResolvedValue({
      vehicleCount: 2,
      firstPullPending: false,
      vehicles: [
        {
          vin: 'VIN1',
          registration: 'ZZ00ZZ0001',
          type: 'EDC',
          isBs6: true,
          vehicleId: 'v1',
          accountName: 'Depot',
          live: {
            status: 'STOPPED',
            ignitionOn: false,
            lastUpdateAt: recent,
            statusSince: since,
            latitude: 22.64,
            longitude: 88.3,
            alert: null,
            pulledAt: recent,
          },
        },
        {
          vin: 'VIN2',
          registration: 'ZZ00ZZ0002',
          vehicleId: null,
          accountName: 'Depot',
          live: null,
        },
      ],
    });
    render(
      <MemoryRouter>
        <IalertFleetPage />
      </MemoryRouter>,
    );

    const row = (await screen.findByText('ZZ00ZZ0001')).closest('tr');
    expect(within(row).getAllByText('Stopped').length).toBeGreaterThan(0);
    expect(within(row).getByText('for 11h 10m')).toBeInTheDocument();
    expect(within(row).getByText('Off')).toBeInTheDocument();
    expect(within(row).getByText('In your fleet')).toBeInTheDocument();
    expect(within(row).getByText('EDC · BS-VI')).toBeInTheDocument();

    const pending = screen.getByText('ZZ00ZZ0002').closest('tr');
    expect(within(pending).getAllByText('Waiting for first update').length).toBeGreaterThan(0);
    expect(within(pending).getByText('Not added')).toBeInTheDocument();

    expect(screen.getByText(/1 vehicle is not in your fleet yet/)).toBeInTheDocument();
    // One account → no Account column.
    expect(screen.queryByRole('columnheader', { name: 'Account' })).toBeNull();
  });

  it('explains the empty state instead of showing a blank table', async () => {
    fetchIalertVehicles.mockResolvedValue({
      vehicleCount: 0,
      firstPullPending: true,
      vehicles: [],
    });
    render(
      <MemoryRouter>
        <IalertFleetPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Waiting for the first iALERT update')).toBeInTheDocument();
  });
});
