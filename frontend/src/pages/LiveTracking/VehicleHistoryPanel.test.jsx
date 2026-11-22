import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AutoTripService from '../../services/AutoTripService';
import { fleetViewService } from '../../services/fleetViewService';
import VehicleHistoryPanel from './VehicleHistoryPanel';

vi.mock('../../services/AutoTripService', () => ({ default: { list: vi.fn() } }));
vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getTripsHistory: vi.fn() },
}));

const trip = (id, name = 'Old depot') => ({
  _id: id,
  pickup: { name: 'Plant', departedAt: '2026-09-01T00:00:00Z', lat: 22, lng: 88 },
  drop: { name, arrivedAt: '2026-09-02T00:00:00Z', lat: 24, lng: 85 },
  km: { laden: 100 },
});
const visit = (id, tripId) => ({
  kind: 'VISIT',
  arrivedAt: `2026-09-0${id}T00:00:00Z`,
  departedAt: `2026-09-0${id}T01:00:00Z`,
  dwellMin: 60,
  place: { id: 'same-site', name: 'Old depot', lat: 24, lng: 85 },
  trip: tripId ? { to: `/trips/${tripId}` } : null,
});
const mount = (props = {}) =>
  render(
    <MemoryRouter>
      <VehicleHistoryPanel
        registrationNumber="WB01"
        vehicleId="vehicle-1"
        tab="routes"
        {...props}
      />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  AutoTripService.list.mockResolvedValue({ items: [trip('trip-1')], total: 1 });
  fleetViewService.getTripsHistory.mockResolvedValue({ items: [visit(1, 'trip-1')], total: 1 });
});
afterEach(() => vi.restoreAllMocks());

describe('vehicle history overview', () => {
  it('loads trips without a replay date limit, opens the exact trip and pages older records', async () => {
    const onMapPlaces = vi.fn();
    AutoTripService.list.mockImplementation(async ({ page }) =>
      page === 1
        ? { items: [trip('trip-1')], total: 201 }
        : { items: [trip('trip-2', 'Older depot')], total: 201 },
    );
    mount({ onMapPlaces });
    expect(await screen.findByRole('link', { name: /Plant → Old depot/ })).toHaveAttribute(
      'href',
      '/auto-trips/trip-1',
    );
    const [params, options] = AutoTripService.list.mock.calls[0];
    expect(params).toEqual({ vehicleId: 'vehicle-1', page: 1, limit: 200 });
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(onMapPlaces.mock.lastCall[0].places).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ lat: 22, lng: 88, to: '/auto-trips/trip-1' }),
        expect.objectContaining({ lat: 24, lng: 85, to: '/auto-trips/trip-1' }),
      ]),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('link', { name: /Older depot/ })).toHaveAttribute(
      'href',
      '/auto-trips/trip-2',
    );
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(AutoTripService.list.mock.lastCall[0]).toEqual({
      vehicleId: 'vehicle-1',
      page: 2,
      limit: 200,
    });
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('keeps repeat visits separate and opens each visit’s own linked trip', async () => {
    fleetViewService.getTripsHistory.mockResolvedValue({
      items: [visit(1, 'trip-a'), visit(2, 'trip-b'), visit(3, null)],
      total: 3,
    });
    mount({ tab: 'places' });
    const links = await screen.findAllByRole('link', { name: /Old depot/ });
    expect(fleetViewService.getTripsHistory.mock.calls[0][0]).toEqual({
      vehicle: 'WB01',
      page: 1,
      limit: 200,
      signal: expect.any(AbortSignal),
    });
    expect(links[0]).toHaveAttribute('href', '/auto-trips/trip-a');
    expect(links[1]).toHaveAttribute('href', '/auto-trips/trip-b');
    const replay = new URL(links[2].href);
    expect(replay.pathname).toBe('/live-tracking');
    expect(Object.fromEntries(replay.searchParams)).toEqual({
      v: 'WB01',
      from: '2026-09-03T00:00:00Z',
      to: '2026-09-03T01:00:00Z',
      at: '2026-09-03T00:00:00Z',
    });
    expect(AutoTripService.list).not.toHaveBeenCalled();
  });

  it('never requests an unscoped fleet when the selected truck has no master ID', () => {
    mount({ vehicleId: null });
    expect(screen.getByText(/linked fleet vehicle record is needed/)).toBeInTheDocument();
    expect(AutoTripService.list).not.toHaveBeenCalled();
  });

  it('retries failed history reads and uses search across the route history', async () => {
    AutoTripService.list.mockRejectedValueOnce(new Error('Unavailable'));
    mount({ query: 'Old depot' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load');
    fireEvent.click(screen.getByRole('button', { name: 'Retry history' }));
    await screen.findByRole('link', { name: /Old depot/ });
    expect(AutoTripService.list.mock.lastCall[0].search).toBe('Old depot');
  });

  it('discards a late history response after moving to another truck', async () => {
    let resolve;
    AutoTripService.list.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const { rerender } = mount();
    const signal = AutoTripService.list.mock.calls[0][1].signal;
    AutoTripService.list.mockResolvedValue({
      items: [trip('other', 'Other truck depot')],
      total: 1,
    });
    rerender(
      <MemoryRouter>
        <VehicleHistoryPanel registrationNumber="WB02" vehicleId="vehicle-2" tab="routes" />
      </MemoryRouter>,
    );
    await screen.findByRole('link', { name: /Other truck depot/ });
    expect(signal.aborted).toBe(true);
    await act(async () => resolve({ items: [trip('old')], total: 1 }));
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: /Old depot/ })).not.toBeInTheDocument(),
    );
  });
});
