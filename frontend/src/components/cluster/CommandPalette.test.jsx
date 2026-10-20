import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import CommandPalette from './CommandPalette';
import { FleetDataService } from '../../services/FleetDataService';
import { VehicleService } from '../../pages/Profile/VehicleService';

vi.mock('../../services/FleetDataService', () => ({
  FleetDataService: { getFleetHealth: vi.fn() },
}));

vi.mock('../../pages/Profile/VehicleService', () => ({
  VehicleService: { getFleetDashboard: vi.fn() },
}));

vi.mock('../../services/searchService', () => ({
  searchAll: vi.fn(),
}));

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FleetDataService.getFleetHealth.mockResolvedValue({ vehicles: [] });
    VehicleService.getFleetDashboard.mockResolvedValue([]);
  });

  // The palette is mounted for the whole session but most users never open it.
  it('fetches the fleet strip only once the palette is opened', async () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    expect(FleetDataService.getFleetHealth).not.toHaveBeenCalled();
    expect(VehicleService.getFleetDashboard).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    await waitFor(() => expect(FleetDataService.getFleetHealth).toHaveBeenCalledTimes(1));
    expect(VehicleService.getFleetDashboard).toHaveBeenCalledTimes(1);
  });
});
