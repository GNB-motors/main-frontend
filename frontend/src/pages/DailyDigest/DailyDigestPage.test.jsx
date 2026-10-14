import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import OwnerValueService from '../../services/OwnerValueService';
import DailyDigestPage from './DailyDigestPage';

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
      <DailyDigestPage />
    </MemoryRouter>,
  );

describe('DailyDigestPage', () => {
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
});
