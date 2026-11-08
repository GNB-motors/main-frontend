import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReplayView from './ReplayView';
import RouteHubService from '../../../services/RouteHubService';
import buildTrip from './replay/buildTrip';
vi.mock('../../../services/RouteHubService', () => ({
  default: {
    getVehicles: vi.fn(),
    getTrail: vi.fn(),
    getOverspeedEvents: vi.fn(),
    getDeviationEvents: vi.fn(),
    getTripAnchors: vi.fn(),
    getTripsForVehicle: vi.fn(),
  },
}));
vi.mock('../../../services/RoadService', () => ({
  default: { getRoadTrailIfEnabled: vi.fn().mockResolvedValue(null) },
}));
vi.mock('../routeHubMap', () => ({
  L: {},
  useLeafletMap: () => ({ containerRef: { current: null }, mapRef: { current: null } }),
}));
vi.mock('./replay/useReplayLayers', () => ({ default: () => {} }));
vi.mock('./replay/buildTrip', () => ({ default: vi.fn() }));
vi.mock('./replay/sampleAt', () => ({ default: () => null }));
vi.mock('./replay/tripStats', () => ({ default: () => ({}) }));
vi.mock('./replay/ReplayStatsHead', () => ({ default: () => null }));
vi.mock('./replay/ReplayPerspectiveBar', () => ({ default: () => null }));
vi.mock('./replay/ReplayHud', () => ({ default: () => null }));
vi.mock('./replay/ReplayPlayer', () => ({
  default: ({ trip }) => <div>{trip ? 'Replay ready' : 'Replay empty'}</div>,
}));
vi.mock('./replay/TripLog', () => ({ default: () => null }));
const vehicles = [
  { _id: 'v1', registrationNumber: 'WB11T0662' },
  { _id: 'v2', registrationNumber: 'WB11S1962' },
];
const toast = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  RouteHubService.getVehicles.mockResolvedValue(vehicles);
  RouteHubService.getTrail.mockResolvedValue({ points: [] });
  RouteHubService.getOverspeedEvents.mockResolvedValue({ events: [] });
  RouteHubService.getDeviationEvents.mockResolvedValue({ records: [] });
  RouteHubService.getTripAnchors.mockResolvedValue(null);
  RouteHubService.getTripsForVehicle.mockResolvedValue([]);
  buildTrip.mockReturnValue({ durationMin: 1, startAt: 0 });
});
const mount = () =>
  render(<ReplayView params={new URLSearchParams('v=WB11T0662')} toast={toast} />);
describe('Replay loading', () => {
  it('loads the edited dates and confirms only a successfully built replay', async () => {
    mount();
    await screen.findByText('Replay ready');
    RouteHubService.getTrail.mockClear();
    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-11-02' } });
    fireEvent.click(screen.getByRole('button', { name: 'Load replay' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Replay loaded · WB11T0662'));
    expect(RouteHubService.getTrail).toHaveBeenCalledWith(
      'WB11T0662',
      expect.objectContaining({
        from: new Date('2026-11-01T00:00:00').toISOString(),
        to: new Date('2026-11-02T23:59:59').toISOString(),
      }),
    );
  });
  it('shows loading failures and allows retry without claiming success', async () => {
    mount();
    await screen.findByText('Replay ready');
    RouteHubService.getTrail.mockRejectedValueOnce(new Error('Trail unavailable'));
    fireEvent.click(screen.getByRole('button', { name: 'Load replay' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Trail unavailable');
    expect(toast).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Load replay' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Replay loaded · WB11T0662'));
  });
  it('rejects reversed dates and explains an empty trail', async () => {
    mount();
    await screen.findByText('Replay ready');
    RouteHubService.getTrail.mockClear();
    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-11-07' } });
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-11-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Load replay' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose valid dates');
    expect(RouteHubService.getTrail).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-11-01' } });
    buildTrip.mockReturnValue(null);
    fireEvent.click(screen.getByRole('button', { name: 'Load replay' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No position fixes');
    expect(toast).not.toHaveBeenCalled();
  });
  it('loads a new search selection while the replay tab remains mounted', async () => {
    const { rerender } = mount();
    await screen.findByText('Replay ready');
    rerender(<ReplayView params={new URLSearchParams('v=WB11S1962')} toast={toast} />);
    await waitFor(() =>
      expect(RouteHubService.getTrail).toHaveBeenCalledWith('WB11S1962', expect.any(Object)),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Load replay' })).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'WB11S1962' }));
    fireEvent.click(screen.getByRole('option', { name: 'WB11T0662' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'WB11T0662' })).toBeInTheDocument(),
    );
  });
});
