import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import FleetDataService from '../../services/FleetDataService';
import Vehicle360Page from './Vehicle360Page';

vi.mock('../../services/FleetDataService', () => ({
  default: { getVehicleProfile: vi.fn(), getVehicleHealth: vi.fn() },
}));
vi.mock('./VehicleHeaderCard', () => ({
  default: ({ profile }) => <div>Profile for {profile.fleetMaster?.registrationNumber}</div>,
}));
vi.mock('./panels/OverviewPanel', () => ({ default: () => <div>Vehicle dashboard data</div> }));
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
  FleetDataService.getVehicleHealth.mockResolvedValue({ history: [] });
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
