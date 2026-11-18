import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import FleetDataService from '../../services/FleetDataService';
import Vehicle360Page from './Vehicle360Page';
import { resetScreenSupport } from './vehicleScreen';

vi.mock('../../services/FleetDataService', () => ({
  default: {
    getVehicleProfile: vi.fn(),
    getVehicleHealth: vi.fn(),
    getVehicleScreen: vi.fn(),
    getVehicleOverview: vi.fn(),
  },
}));
vi.mock('./VehicleHeaderCard', () => ({
  default: ({ profile, overview }) => (
    <div>
      <div>Profile for {profile.fleetMaster?.registrationNumber}</div>
      <span data-testid="header-overview">{overview ? 'shared' : 'own'}</span>
    </div>
  ),
}));
vi.mock('./panels/OverviewPanel', () => ({
  default: ({ overview }) => (
    <div>
      <div>Vehicle dashboard data</div>
      <span data-testid="panel-overview">{overview ? 'shared' : 'own'}</span>
    </div>
  ),
}));
vi.mock('./panels/ServicePanel', () => ({ default: () => null }));
vi.mock('./panels/FuelPanel', () => ({ default: () => null }));
vi.mock('./panels/DocumentsPanel', () => ({ default: () => null }));
vi.mock('./panels/TelemetryPanel', () => ({ default: () => null }));
vi.mock('./panels/TyresPanel', () => ({ default: () => null }));
vi.mock('./panels/TripsPanel', () => ({ default: () => null }));
vi.mock('./panels/DriversPanel', () => ({ default: () => null }));

function Navigation() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/vehicles/360/BLOCKED')}>Open other vehicle</button>;
}
const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/vehicles/360/REGISTERED']}>
      <Navigation />
      <Routes>
        <Route path="/vehicles/360/:registrationNumber" element={<Vehicle360Page />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  resetScreenSupport();
  FleetDataService.getVehicleHealth.mockResolvedValue({ history: [] });
  // The backend has no screen route yet: every vehicle falls back.
  FleetDataService.getVehicleScreen.mockRejectedValue({ status: 404 });
});

it('explains registered-fleet access on 404 without rendering telemetry panels', async () => {
  FleetDataService.getVehicleProfile.mockRejectedValue({ status: 404 });
  renderPage();
  expect(await screen.findByText('Vehicle unavailable — REGISTERED')).toBeInTheDocument();
  expect(
    screen.getByText(/not available in your registered fleet or selected location/),
  ).toBeInTheDocument();
  expect(screen.queryByText('Vehicle dashboard data')).not.toBeInTheDocument();
  expect(FleetDataService.getVehicleHealth).not.toHaveBeenCalled();
});

it('shows a branch denial instead of opening a blank profile', async () => {
  FleetDataService.getVehicleProfile.mockRejectedValue({
    status: 403,
    displayMessage: 'This branch is outside your assigned location.',
  });
  renderPage();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'This branch is outside your assigned location.',
  );
  expect(screen.queryByText('Vehicle dashboard data')).not.toBeInTheDocument();
  expect(FleetDataService.getVehicleHealth).not.toHaveBeenCalled();
});

it('hides the previous truck immediately when navigating to an unavailable registration', async () => {
  let rejectBlocked;
  FleetDataService.getVehicleProfile.mockImplementation((plate) =>
    plate === 'REGISTERED'
      ? Promise.resolve({
          fleetMaster: { id: 'v1', registrationNumber: plate },
          health: { canOdo: 100 },
        })
      : new Promise((_resolve, reject) => {
          rejectBlocked = reject;
        }),
  );
  renderPage();
  expect(await screen.findByText('Profile for REGISTERED')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Open other vehicle' }));
  expect(screen.queryByText('Profile for REGISTERED')).not.toBeInTheDocument();
  expect(screen.queryByText('Vehicle dashboard data')).not.toBeInTheDocument();
  await waitFor(() => expect(rejectBlocked).toBeTypeOf('function'));
  await act(async () => rejectBlocked({ status: 404 }));
  expect(await screen.findByText('Vehicle unavailable — BLOCKED')).toBeInTheDocument();
  expect(screen.queryByText('Vehicle dashboard data')).not.toBeInTheDocument();
});

it('reads the whole vehicle screen in one call and hands the overview to the panels', async () => {
  FleetDataService.getVehicleScreen.mockResolvedValue({
    profile: { fleetMaster: { id: 'v1', registrationNumber: 'REGISTERED' } },
    health: { canOdo: 100, history: [] },
    overview: { odometer: { value: 100 } },
  });
  renderPage();
  expect(await screen.findByText('Profile for REGISTERED')).toBeInTheDocument();
  expect(screen.getByTestId('header-overview')).toHaveTextContent('shared');
  expect(screen.getByTestId('panel-overview')).toHaveTextContent('shared');
  expect(FleetDataService.getVehicleScreen).toHaveBeenCalledTimes(1);
  expect(FleetDataService.getVehicleProfile).not.toHaveBeenCalled();
  expect(FleetDataService.getVehicleHealth).not.toHaveBeenCalled();
});

it('falls back to profile, health and overview when the screen read is missing', async () => {
  FleetDataService.getVehicleProfile.mockResolvedValue({
    fleetMaster: { id: 'v1', registrationNumber: 'REGISTERED' },
    health: { canOdo: 100 },
  });
  renderPage();
  expect(await screen.findByText('Profile for REGISTERED')).toBeInTheDocument();
  await waitFor(() => expect(FleetDataService.getVehicleHealth).toHaveBeenCalled());
  expect(FleetDataService.getVehicleScreen).toHaveBeenCalledTimes(1);
});

it('does not ask for the screen read again once it is known to be missing', async () => {
  FleetDataService.getVehicleProfile.mockResolvedValue({
    fleetMaster: { id: 'v1', registrationNumber: 'REGISTERED' },
    health: { canOdo: 100 },
  });
  renderPage();
  await waitFor(() => expect(FleetDataService.getVehicleProfile).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: 'Open other vehicle' }));
  await waitFor(() => expect(FleetDataService.getVehicleProfile).toHaveBeenCalledTimes(2));
  expect(FleetDataService.getVehicleScreen).toHaveBeenCalledTimes(1);
});
