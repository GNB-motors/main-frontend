import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { getDigest, getMileage, getVehicleList, listTrips, refreshLive } = vi.hoisted(() => ({
  getDigest: vi.fn(),
  getMileage: vi.fn(),
  getVehicleList: vi.fn(),
  listTrips: vi.fn(),
  refreshLive: vi.fn(),
}));

vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getDigest, getMileage },
}));
vi.mock('../../hooks/useLivePositions', () => ({
  useLivePositions: () => ({ positions: [], isLoading: false, refresh: refreshLive }),
}));
vi.mock('../../services/vehicleListService', () => ({
  getVehicleList,
  invalidateVehicleList: vi.fn(),
}));
vi.mock('../../services/AutoTripService', () => ({ AutoTripService: { list: listTrips } }));

import DailyDigestPage from './DailyDigestPage';
import digestFixture from '../../test/fixtures/redesign/digest.json';

const renderPage = () =>
  render(
    <MemoryRouter>
      <DailyDigestPage />
    </MemoryRouter>,
  );

describe('DailyDigestPage', () => {
  beforeEach(() => {
    getDigest.mockReset();
    getDigest.mockResolvedValue(digestFixture);
    getMileage.mockReset().mockResolvedValue({ items: [] });
    getVehicleList.mockReset().mockResolvedValue([{ registrationNumber: 'WB11F0162' }]);
    listTrips.mockReset().mockResolvedValue({ items: [], total: 7 });
    refreshLive.mockReset();
  });

  it('shows the headline the API sent', async () => {
    renderPage();
    expect(
      await screen.findByText('A good day: 41 loaded trips, 3 trucks need you.'),
    ).toBeInTheDocument();
  });

  it('renders the story cards in the order the API sent them', async () => {
    renderPage();
    await screen.findByText('Loaded runs');
    fireEvent.click(screen.getByText('Daily report details'));
    const headings = screen.getAllByRole('heading').map((h) => h.textContent);
    expect(headings.indexOf('Loaded runs')).toBeLessThan(headings.indexOf('Empty runs'));
    expect(headings.indexOf('Empty runs')).toBeLessThan(headings.indexOf('Who drove well'));
    expect(headings.indexOf('Who drove well')).toBeLessThan(headings.indexOf('Who needs a word'));
  });

  it('shows the card text exactly as the API sent it', async () => {
    renderPage();
    expect(
      await screen.findByText(/Most of your distance today carried cement and clinker/),
    ).toBeInTheDocument();
  });

  it('shows the big number of a card', async () => {
    renderPage();
    expect(await screen.findByText('41 trips · 4,820 km')).toBeInTheDocument();
  });

  it('links a card to where the API said', async () => {
    renderPage();
    const link = await screen.findByText('See all in Intelligence →');
    expect(link.getAttribute('href')).toBe('/intelligence?tab=runs');
  });

  it('shows a reconnect banner with the button that fixes it', async () => {
    renderPage();
    expect(await screen.findByText(/is disconnected/)).toBeInTheDocument();
    const button = screen.getByRole('link', { name: 'Reconnect' });
    expect(button.getAttribute('href')).toBe('/settings/fleetedge-accounts');
  });

  it('says nothing happened on a quiet day', async () => {
    getDigest.mockResolvedValue({ date: '2026-11-02', headline: '', story: [] });
    renderPage();
    expect(await screen.findByText(/Nothing happened on this day/)).toBeInTheDocument();
  });

  it('says it could not load the digest when the request failed', async () => {
    getDigest.mockRejectedValue(new Error('boom'));
    renderPage();
    expect(await screen.findByText(/could not load today/)).toBeInTheDocument();
  });

  it('asks for the digest once, for the day it is showing', async () => {
    renderPage();
    await waitFor(() => expect(getDigest).toHaveBeenCalledTimes(1));
    expect(getDigest.mock.calls[0][0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('uses one open-trip response for the live KPI and routes', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Fleet Overview' });
    await waitFor(() => expect(listTrips).toHaveBeenCalledTimes(1));
    expect(listTrips.mock.calls[0][0]).toEqual({ status: 'OPEN', limit: 50 });
    expect(await screen.findByText('7')).toBeInTheDocument();
    expect(getVehicleList).toHaveBeenCalledTimes(1);
    expect(getMileage).toHaveBeenCalledTimes(1);
  });

  it('changes the report date without reloading current trips or fleet inventory', async () => {
    renderPage();
    await screen.findByText('A good day: 41 loaded trips, 3 trucks need you.');
    fireEvent.change(screen.getByLabelText('Digest date'), { target: { value: '2026-10-30' } });
    await waitFor(() =>
      expect(getDigest).toHaveBeenLastCalledWith(expect.objectContaining({ date: '2026-10-30' })),
    );
    await waitFor(() =>
      expect(getMileage).toHaveBeenLastCalledWith(
        expect.objectContaining({ from: '2026-10-24', to: '2026-10-30', groupBy: 'cycle' }),
      ),
    );
    expect(listTrips).toHaveBeenCalledTimes(1);
    expect(getVehicleList).toHaveBeenCalledTimes(1);
  });

  it('refreshes each owned source once and keeps live operations visible on report failure', async () => {
    getDigest.mockRejectedValue(new Error('boom'));
    renderPage();
    await screen.findByText(/could not load today/);
    expect(screen.getByRole('heading', { name: 'Your fleet, in view' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(getDigest).toHaveBeenCalledTimes(2));
    expect(listTrips).toHaveBeenCalledTimes(2);
    expect(getVehicleList).toHaveBeenCalledTimes(2);
    expect(getMileage).toHaveBeenCalledTimes(2);
    expect(refreshLive).toHaveBeenCalledTimes(1);
  });
});
