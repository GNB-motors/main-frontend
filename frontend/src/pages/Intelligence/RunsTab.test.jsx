import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./IntelligenceService', () => ({
  default: { getSummary: vi.fn(), getAutoTrips: vi.fn() },
}));

import IntelligenceService from './IntelligenceService';
import RunsTab from './RunsTab';

const summary = {
  period: { from: '2026-10-27T18:30:00Z', to: '2026-11-02T18:30:00Z' },
  fleet: { trucks: 124, reporting: 118, disconnected: 6 },
  runs: {
    loadedKm: 42180,
    emptyKm: 8420,
    repositionKm: 12600,
    loadedTrips: 268,
    plantToPlant: 966,
    emptySharePct: 13.3,
    why: {
      text: 'Plants work like warehouses, so a truck going from one plant to another is a normal run and is not counted as empty.',
      basis: 'From 268 loaded trips and 966 plant-to-plant runs since 15 Sep',
    },
  },
  tiles: [],
};

const trips = {
  items: [
    {
      _id: 't1',
      registrationNumber: 'WB11L8862',
      drop: { name: 'OCL' },
      km: { laden: 900, return: 300 },
    },
    {
      _id: 't2',
      registrationNumber: 'WB11L8862',
      flags: ['PICKUP_TO_PICKUP'],
      km: { laden: 40, return: 20 },
    },
  ],
  total: 2,
};

describe('RunsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    IntelligenceService.getSummary.mockResolvedValue(summary);
    IntelligenceService.getAutoTrips.mockResolvedValue(trips);
  });

  it('shows the loaded, empty and plant-to-plant kilometres', async () => {
    render(
      <MemoryRouter>
        <RunsTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Loaded km')).toBeInTheDocument();
    expect(screen.getByText('42,180 km')).toBeInTheDocument();
    expect(screen.getByText('Empty km')).toBeInTheDocument();
    expect(screen.getByText('8,420 km')).toBeInTheDocument();
    expect(screen.getAllByText('Plant-to-plant').length).toBeGreaterThan(0);
    expect(screen.getByText('966 runs')).toBeInTheDocument();
  });

  it('never counts a plant-to-plant run as an empty run', async () => {
    render(
      <MemoryRouter>
        <RunsTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    const bar = await screen.findByRole('link', { name: /WB11L8862/ });
    expect(bar).toHaveAccessibleName(
      'WB11L8862, 1,260 km in total, 900 km loaded, 320 km empty, 40 km plant to plant',
    );
  });

  it('says how much of the driving was empty', async () => {
    render(
      <MemoryRouter>
        <RunsTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Empty share: 13.3% of 63,200 km\./)).toBeInTheDocument();
  });

  it('says the endpoint is still being built on a 404', async () => {
    IntelligenceService.getSummary.mockRejectedValue({ status: 404 });
    IntelligenceService.getAutoTrips.mockRejectedValue({ status: 404 });

    render(
      <MemoryRouter>
        <RunsTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getAllByText(/is being built/).length).toBeGreaterThan(0));
  });
});
