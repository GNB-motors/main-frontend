import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import OwnerValueService from '../../services/OwnerValueService';
import ReleaseDigest from './ReleaseDigest';
import DailyDigestPage from './DailyDigestPage';
import digestRouteMemory from './digestRouteMemory';
import { fleetViewService } from '../../services/fleetViewService';

vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: {
    getDigest: vi.fn(async () => {
      throw Object.assign(new Error('Not deployed'), { status: 404 });
    }),
    getDailyFuel: vi.fn(async () => ({ items: [] })),
    getMorningBrief: vi.fn(async () => ({})),
    getOwnerReport: vi.fn(async () => ({ sections: [] })),
  },
}));
vi.mock('../../hooks/useLivePositions', () => ({
  useLivePositions: () => ({ positions: [], isLoading: false, refresh: vi.fn() }),
}));
vi.mock('../../services/vehicleListService', () => ({
  getVehicleList: vi.fn(async () => []),
  invalidateVehicleList: vi.fn(),
}));
vi.mock('../../services/AutoTripService', () => ({
  AutoTripService: { list: vi.fn(async () => ({ items: [], total: 0 })) },
}));
vi.mock('../../api/performance', () => ({
  default: { leaderboards: vi.fn(async () => ({ boards: [] })) },
}));

vi.mock('../../services/OwnerValueService', () => {
  const svc = { getDigest: vi.fn() };
  return { default: svc, OwnerValueService: svc };
});
vi.mock('../../services/FleetDataService', () => ({
  default: {
    getFleetAlertSummary: vi.fn(async () => ({})),
    getDriverLeaderboard: vi.fn(async () => ({ drivers: [] })),
  },
}));
vi.mock('../Profile/VehicleService.js', () => ({
  VehicleService: { getFleetDashboard: vi.fn(async () => []) },
}));
vi.mock('../OwnerAlerts/OwnerAlertsService', () => ({
  OwnerAlertsService: { getAlerts: vi.fn(async () => ({ items: [] })) },
}));
vi.mock('../FuelIntegrity/FuelIntegrityService', () => ({
  FuelIntegrityService: { getSummary: vi.fn(async () => ({})) },
}));

const digest = {
  money: { money: { fuelCostInr: 12000, defCostInr: 800 }, idlingTop5: [], detourTop5: [] },
  healthScore: { score: 82, grade: 'B' },
  utilization: { fleet: {} },
  downtimeRisk: { vehicles: [] },
  fuelEfficiency: { worst: [] },
  refuellingToday: { fills: [], totalCount: 0 },
  fleetCalendar: { vehicles: [] },
  morningBrief: null,
  errors: {},
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReleaseDigest />
    </MemoryRouter>,
  );

// The release digest is the fallback the new page shows while
// /api/fleet-view/digest is not on prod. It keeps its own honest labels.
describe('ReleaseDigest (the fallback)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    OwnerValueService.getDigest.mockResolvedValue(digest);
  });

  // B1: eight owner-value requests on open became one.
  it('loads every owner-value section with a single request', async () => {
    renderPage();
    expect(await screen.findByText('Grade B')).toBeInTheDocument();
    expect(OwnerValueService.getDigest).toHaveBeenCalledTimes(1);
    expect(OwnerValueService.getDigest.mock.calls[0][0]).toMatchObject({
      efficiencyDays: 7,
      calendarDays: 14,
    });
  });

  it('refreshes the digest once, not once per section', async () => {
    renderPage();
    await screen.findByText('Grade B');
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    await waitFor(() => expect(OwnerValueService.getDigest).toHaveBeenCalledTimes(2));
  });

  it('uses the new operations layout on a server with only the legacy digest', async () => {
    render(
      <MemoryRouter>
        <DailyDigestPage />
      </MemoryRouter>,
    );
    await screen.findByText('Detailed operational reports');
    expect(screen.getByRole('heading', { name: 'Daily digest' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Fleet right now' })).not.toBeInTheDocument();
    expect(screen.getByText('Detailed operational reports')).toBeInTheDocument();
    await waitFor(() => expect(OwnerValueService.getDigest).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(OwnerValueService.getDigest).toHaveBeenCalledTimes(2));
    fireEvent.change(screen.getByLabelText('Digest date'), { target: { value: '2026-10-30' } });
    expect(
      await screen.findByText(/Historical digest reports are unavailable/),
    ).toBeInTheDocument();
  });
});

describe('DailyDigestPage on a server without the new digest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    digestRouteMemory.forget();
    OwnerValueService.getDigest.mockResolvedValue(digest);
  });

  const renderDigestPage = () =>
    render(
      <MemoryRouter>
        <DailyDigestPage />
      </MemoryRouter>,
    );

  it('remembers the 404, so the next visit starts the release digest without asking again', async () => {
    const first = renderDigestPage();
    await screen.findByText('Detailed operational reports');
    expect(digestRouteMemory.knownMissing()).toBe(true);
    first.unmount();
    vi.clearAllMocks();
    OwnerValueService.getDigest.mockResolvedValue(digest);
    renderDigestPage();
    await screen.findByText('Detailed operational reports');
    expect(fleetViewService.getDigest).not.toHaveBeenCalled();
    // The owner report is read once, not once per layout the page passes through.
    expect(fleetViewService.getOwnerReport).toHaveBeenCalledTimes(1);
  });

  it('forgets the 404 after a few hours, so a deploy that adds the route is picked up', () => {
    const now = Date.now();
    digestRouteMemory.remember(now);
    expect(digestRouteMemory.knownMissing(now + 60 * 1000)).toBe(true);
    expect(digestRouteMemory.knownMissing(now + digestRouteMemory.REMEMBER_MS + 1)).toBe(false);
  });
});
