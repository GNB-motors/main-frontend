import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OverspeedView from './OverspeedView.jsx';
import RouteHubService from '../../../services/RouteHubService';

vi.mock('../../../services/RouteHubService', () => ({
  default: { getVehicles: vi.fn(), getOverspeedEvents: vi.fn(), getTrail: vi.fn() },
}));
vi.mock('../routeHubMap', () => ({
  L: {},
  useLeafletMap: () => ({ containerRef: { current: null }, mapRef: { current: null } }),
  useLayerGroup: () => {},
}));

beforeEach(() => {
  vi.clearAllMocks();
  RouteHubService.getVehicles.mockResolvedValue([{ _id: 'v1', registrationNumber: 'WB25R9540' }]);
});

it('uses the event response ground speed without fetching a separate device-speed trail', async () => {
  RouteHubService.getOverspeedEvents.mockResolvedValue({
    registrationNumber: 'WB25R9540',
    from: '2026-11-09T00:00:00Z',
    to: '2026-11-09T01:00:00Z',
    events: [],
    speedSeries: [
      {
        startAt: '2026-11-09T00:00:00Z',
        endAt: '2026-11-09T00:04:00Z',
        speedKmh: 78,
        quality: 'GOOD',
      },
    ],
  });
  render(
    <OverspeedView
      params={new URLSearchParams('v=v1')}
      toast={vi.fn()}
      setBadge={vi.fn()}
      go={vi.fn()}
    />,
  );
  expect(await screen.findByRole('img', { name: 'Ground speed over time' })).toBeInTheDocument();
  expect(screen.getByLabelText('Ground speed').getAttribute('d')).not.toBe('');
  expect(RouteHubService.getTrail).not.toHaveBeenCalled();
});

it('shows unavailable ground speed when the response has no usable intervals', async () => {
  RouteHubService.getOverspeedEvents.mockResolvedValue({
    registrationNumber: 'WB25R9540',
    events: [],
    speedSeries: [],
  });
  render(
    <OverspeedView
      params={new URLSearchParams('v=v1')}
      toast={vi.fn()}
      setBadge={vi.fn()}
      go={vi.fn()}
    />,
  );
  expect(
    await screen.findByText('No usable ground-speed intervals for this vehicle in the window.'),
  ).toBeInTheDocument();
  expect(screen.queryByRole('img', { name: 'Ground speed over time' })).not.toBeInTheDocument();
  expect(RouteHubService.getTrail).not.toHaveBeenCalled();
});
