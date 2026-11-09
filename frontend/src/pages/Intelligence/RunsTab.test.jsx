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

    expect(await screen.findByText('Empty share')).toBeInTheDocument();
    expect(screen.getByText('13.3%')).toBeInTheDocument();
    expect(screen.getByText('of 63,200 km driven')).toBeInTheDocument();
  });

  it('calls the empty running "running with no load"', async () => {
    render(
      <MemoryRouter>
        <RunsTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('running with no load')).toBeInTheDocument();
  });

  it('claims no loaded share when the empty running was not measured', async () => {
    IntelligenceService.getSummary.mockResolvedValue({
      ...summary,
      runs: { ...summary.runs, emptyKm: null, emptySharePct: null },
    });

    render(
      <MemoryRouter>
        <RunsTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Not enough classified distance/)).toBeInTheDocument();
    expect(screen.queryByText(/carried load/)).toBeNull();
  });

  it('says one truck has unknown km', async () => {
    IntelligenceService.getAutoTrips.mockResolvedValue({
      items: [
        {
          _id: 't1',
          registrationNumber: 'WB11L8862',
          drop: { name: 'OCL' },
          km: { laden: 900, approach: null, return: null },
        },
      ],
      total: 1,
    });

    render(
      <MemoryRouter>
        <RunsTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/1 truck has unknown km/)).toBeInTheDocument();
  });

  it('keeps the plant-to-plant tile when the server sends no reposition km', async () => {
    // The new backend always sends `repositionKm: null`: the approach km are
    // inside the empty km now. The tile stays and says so — it is not removed.
    IntelligenceService.getSummary.mockResolvedValue({
      ...summary,
      runs: { ...summary.runs, repositionKm: null, plantToPlant: 3 },
    });

    render(
      <MemoryRouter>
        <RunsTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Plant-to-plant')).toBeInTheDocument();
    expect(screen.getByText('included in empty km')).toBeInTheDocument();
    // The plant-to-plant run count is still shown.
    expect(screen.getByText(/3 plant-to-plant runs/)).toBeInTheDocument();
  });

  it('keeps the plant-to-plant tile and its run count on the old backend', async () => {
    render(
      <MemoryRouter>
        <RunsTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Plant-to-plant')).toBeInTheDocument();
    expect(screen.getByText('12,600 km')).toBeInTheDocument();
    expect(screen.getByText('966 runs')).toBeInTheDocument();
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

  describe('the server’s own bars, which carry the unknown km', () => {
    const withBars = {
      ...summary,
      runs: {
        ...summary.runs,
        byTruck: [
          {
            registrationNumber: 'WB11L8862',
            loadedKm: 900,
            emptyKm: 240,
            unknownKm: 120,
            totalKm: 1260,
            kmPartial: true,
          },
          {
            registrationNumber: 'WB11L9999',
            loadedKm: 500,
            emptyKm: 100,
            unknownKm: null,
            totalKm: 600,
            kmPartial: false,
          },
        ],
      },
    };

    it('shows the km it could not attribute beside the bar', async () => {
      IntelligenceService.getSummary.mockResolvedValue(withBars);

      render(
        <MemoryRouter>
          <RunsTab from="2026-10-27" to="2026-11-02" />
        </MemoryRouter>,
      );

      expect(await screen.findByText('120 km not attributed')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /WB11L8862/ })).toHaveAccessibleName(
        'WB11L8862, 1,260 km in total, 900 km loaded, 240 km empty, — plant to plant, 120 km not attributed, neither loaded nor empty',
      );
    });

    it('says nothing beside the bar when the server did not send unknown km', async () => {
      IntelligenceService.getSummary.mockResolvedValue(withBars);

      render(
        <MemoryRouter>
          <RunsTab from="2026-10-27" to="2026-11-02" />
        </MemoryRouter>,
      );

      await screen.findByText('120 km not attributed');
      expect(screen.getAllByText(/not attributed/)).toHaveLength(1);
      expect(document.body.textContent).not.toContain('undefined');
    });

    it('counts a truck whose km were only partly measured', async () => {
      IntelligenceService.getSummary.mockResolvedValue(withBars);

      render(
        <MemoryRouter>
          <RunsTab from="2026-10-27" to="2026-11-02" />
        </MemoryRouter>,
      );

      expect(await screen.findByText(/1 truck has unknown km/)).toBeInTheDocument();
    });

    it('claims no empty share for a truck whose distance is only partly known', async () => {
      IntelligenceService.getSummary.mockResolvedValue(withBars);

      render(
        <MemoryRouter>
          <RunsTab from="2026-10-27" to="2026-11-02" />
        </MemoryRouter>,
      );

      await screen.findByText('120 km not attributed');
      expect(screen.queryByText(/empty ·/)).toBeNull();
    });
  });
});
