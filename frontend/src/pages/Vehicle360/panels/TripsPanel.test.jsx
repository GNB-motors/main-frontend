import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import TripsPanel from './TripsPanel';
import FleetDataService from '../../../services/FleetDataService';

vi.mock('../../../services/FleetDataService', () => ({
  default: {
    getAutoTrips: vi.fn(),
    getVehicleTours: vi.fn(),
  },
}));

const TRIPS = {
  items: [
    {
      _id: 'trip-1',
      status: 'COMPLETE',
      pickup: { name: 'Plant A', departedAt: '2026-11-03T02:00:00.000Z' },
      drop: { name: 'Site B', arrivedAt: '2026-11-03T09:00:00.000Z' },
      km: { approach: 10, laden: 120, return: 130 },
    },
    {
      _id: 'trip-2',
      status: 'NEEDS_REVIEW',
      pickup: { name: 'Plant A', departedAt: '2026-11-02T02:00:00.000Z' },
      drop: { name: 'Site C', arrivedAt: '2026-11-02T08:00:00.000Z' },
      km: null,
    },
  ],
};

const TOURS = {
  tours: [
    {
      status: 'OPEN',
      startedAt: '2026-11-03T02:00:00.000Z',
      distanceKm: null,
      legs: [
        {
          from: 'Plant A',
          to: 'Site B',
          departedAt: '2026-11-03T02:00:00.000Z',
          arrivedAt: '2026-11-03T09:00:00.000Z',
          km: 130,
        },
      ],
    },
  ],
};

function renderPanel() {
  return render(
    <MemoryRouter>
      <TripsPanel vehicleId="veh-1" registrationNumber="WB01AB1234" />
    </MemoryRouter>,
  );
}

describe('TripsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FleetDataService.getAutoTrips.mockResolvedValue(TRIPS);
    FleetDataService.getVehicleTours.mockResolvedValue(TOURS);
  });

  it('shows the open cycle with its legs and the detected trips', async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText('Open cycle')).toBeTruthy());
    expect(screen.getAllByText(/Plant A/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Site B/).length).toBeGreaterThan(0);
    expect(screen.getByText('Resolved legs')).toBeTruthy();

    expect(screen.getByText('Recent trips')).toBeTruthy();
    expect(within(screen.getByRole('table')).getByText('260 km')).toBeTruthy();
    expect(within(screen.getByRole('table')).getByText('Complete')).toBeTruthy();
    expect(within(screen.getByRole('table')).getByText('Needs review')).toBeTruthy();
  });

  it('never turns an unmeasured distance into a zero', async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText('Open cycle')).toBeTruthy());
    // The cycle is open, so it has no distance yet — that is stated, not shown as 0 km.
    expect(screen.getByText('Not measured yet')).toBeTruthy();
    // The second trip has no km reading at all.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.queryByText('0 km')).toBeNull();
  });

  it('says the truck is parked when no cycle is open', async () => {
    FleetDataService.getVehicleTours.mockResolvedValue({
      tours: [{ status: 'CLOSED', startedAt: '2026-11-01T02:00:00.000Z', distanceKm: 480 }],
    });

    renderPanel();

    await waitFor(() => expect(screen.getAllByText('No open cycle')[0]).toBeTruthy());
    expect(screen.queryByText('Out now')).toBeNull();
  });
  it('filters actual trip records by status', async () => {
    renderPanel();
    await screen.findByRole('table');
    fireEvent.click(screen.getByRole('button', { name: /^Needs review/ }));
    const table = within(screen.getByRole('table'));
    expect(table.getByText('Site C')).toBeInTheDocument();
    expect(table.queryByText('Site B')).not.toBeInTheDocument();
  });
});
