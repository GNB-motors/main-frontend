import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HotspotIncidents from './HotspotIncidents';
import { getHotspotIncidents } from '../../services/HotspotService.js';

vi.mock('../../services/HotspotService.js', () => ({ getHotspotIncidents: vi.fn() }));

const renderIt = () =>
  render(
    <MemoryRouter>
      <HotspotIncidents hotspotId="h1" />
    </MemoryRouter>,
  );

describe('HotspotIncidents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists each incident with its truck, fuel change and time', async () => {
    getHotspotIncidents.mockResolvedValue({
      hotspotId: 'h1',
      shared: false,
      windowDays: 90,
      incidentCount: 2,
      otherFleets: 0,
      items: [
        {
          id: 'a1',
          registrationNumber: 'WB11S6162',
          kind: 'THEFT',
          at: '2026-11-15T13:40:00.000Z',
          fuelBeforeL: 180,
          fuelAfterL: 140,
          fuelChangeL: -40,
          place: 'Kharagpur',
        },
        { id: 'a2', registrationNumber: null, kind: 'UNAUTHORISED_REFUEL', pumpName: 'Cash pump' },
      ],
    });
    renderIt();
    const link = await screen.findByRole('link', { name: 'WB11S6162' });
    expect(link).toHaveAttribute('href', '/vehicles/WB11S6162?tab=fuel');
    expect(screen.getByText('−40 L (180 → 140 L)')).toBeInTheDocument();
    expect(screen.getByText('−40 L (180 → 140 L)')).toHaveClass('is-drop');
    expect(screen.getByText(/Kharagpur/)).toBeInTheDocument();
    expect(screen.getByText(/Refuel at an unapproved pump/)).toBeInTheDocument();
    expect(screen.getByText(/Cash pump/)).toBeInTheDocument();
    expect(getHotspotIncidents).toHaveBeenCalledWith('h1', expect.any(Object));
  });

  it('signs the change by the fuel levels, as FleetEdge reports a drop as a positive size', async () => {
    getHotspotIncidents.mockResolvedValue({
      hotspotId: 'h1',
      shared: false,
      windowDays: 90,
      incidentCount: 2,
      otherFleets: 0,
      items: [
        // Seen on prod: 289 → 272 L arrived with fuelDifferenceL 17.
        {
          id: 'a1',
          registrationNumber: 'WB11F4462',
          kind: 'THEFT',
          fuelBeforeL: 289,
          fuelAfterL: 272,
          fuelChangeL: 17,
        },
        { id: 'a2', registrationNumber: 'WB11F4962', kind: 'THEFT', fuelChangeL: 24 },
      ],
    });
    renderIt();
    expect(await screen.findByText('−17 L (289 → 272 L)')).toBeInTheDocument();
    expect(screen.getByText('−24 L')).toBeInTheDocument();
  });

  it('says how many incidents of a shared hotspot came from other fleets', async () => {
    getHotspotIncidents.mockResolvedValue({
      hotspotId: 'h1',
      shared: true,
      windowDays: 90,
      incidentCount: 2,
      otherFleets: 2,
      items: [],
    });
    renderIt();
    expect(
      await screen.findByText('None of your trucks had an incident here in this window.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 more incidents came from other fleets/)).toBeInTheDocument();
  });
});
