import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import RouteHubPage from './RouteHubPage';
import RouteHubService from '../../services/RouteHubService';
vi.mock('../../services/RouteHubService', () => ({
  default: { getVehicles: vi.fn(), getCorridors: vi.fn() },
}));
vi.mock('./views/OverviewView.jsx', () => ({ default: () => <div>Hub overview</div> }));
vi.mock('./views/ReplayView.jsx', () => ({
  default: ({ params }) => <div>Hub replay: {params.get('v')}</div>,
}));
vi.mock('./views/DeviationView.jsx', () => ({ default: () => <div>Hub deviations</div> }));
function Location() {
  const loc = useLocation();
  return (
    <output data-testid="location">
      {loc.pathname}
      {loc.search}
    </output>
  );
}
function page(entry = '/route-hub') {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Location />
      <RouteHubPage />
    </MemoryRouter>,
  );
}
beforeEach(() => {
  RouteHubService.getVehicles.mockResolvedValue([{ _id: 'v1', registrationNumber: 'WB11T0662' }]);
  RouteHubService.getCorridors.mockResolvedValue([]);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
describe('Route Hub search', () => {
  it('keeps replay deep links inside Route Hub', async () => {
    page('/route-hub?tab=replay&v=WB11T0662');
    expect(await screen.findByText('Hub replay: WB11T0662')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/route-hub?tab=replay&v=WB11T0662');
  });
  it('opens vehicle search results in the hub replay instead of Live Tracking', async () => {
    page();
    await waitFor(() => expect(RouteHubService.getVehicles).toHaveBeenCalled());
    const search = screen.getByRole('textbox', { name: 'Search vehicle, trip or corridor' });
    fireEvent.change(search, { target: { value: 'WB11T0662' } });
    await screen.findByRole('button', { name: /WB11T0662 Vehicle/ });
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(await screen.findByText('Hub replay: WB11T0662')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/route-hub?tab=replay&v=WB11T0662');
  });
});
