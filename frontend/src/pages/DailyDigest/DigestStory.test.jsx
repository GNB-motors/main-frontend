import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { getDigest, getMileage, getVehicleList, listTrips, refreshLive } = vi.hoisted(() => ({
  getDigest: vi.fn(),
  getMileage: vi.fn(),
  getVehicleList: vi.fn(),
  listTrips: vi.fn(),
  refreshLive: vi.fn(),
}));

vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: {
    getDigest,
    getMileage,
    getMorningBrief: vi.fn(async () => ({})),
    getOwnerReport: vi.fn(async () => ({ sections: [] })),
  },
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
  it('replaces each section skeleton as its own source arrives', async () => {
    let finishReport;
    let finishFuel;
    getDigest.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishReport = resolve;
        }),
    );
    getMileage.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishFuel = resolve;
        }),
    );
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Fleet right now' })).toBeInTheDocument();
    expect(screen.getByLabelText('Loading actions')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading fuel, last 7 days')).toBeInTheDocument();
    await act(async () => finishReport(digestFixture));
    expect(screen.queryByRole('status', { name: 'Loading actions' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Loading fuel, last 7 days')).toBeInTheDocument();
    await act(async () => finishFuel({ items: [] }));
    expect(
      screen.queryByRole('status', { name: 'Loading fuel, last 7 days' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('No measured fuel cycles in this window.')).toBeInTheDocument();
  });
  beforeEach(() => {
    getDigest.mockReset();
    getDigest.mockResolvedValue(digestFixture);
    getMileage.mockReset().mockResolvedValue({ items: [] });
    getVehicleList.mockReset().mockResolvedValue([{ registrationNumber: 'WB11F0162' }]);
    listTrips.mockReset().mockResolvedValue({ items: [], total: 7 });
    refreshLive.mockReset();
  });

  it('shows the headline the API sent as the page subtitle', async () => {
    renderPage();
    expect(
      await screen.findByText(/A good day: 41 loaded trips, 3 trucks need you\./),
    ).toBeInTheDocument();
  });

  it('lays the page out as real sections, with no "More…" disclosures', async () => {
    renderPage();
    await screen.findByText(/A good day/);
    const headings = screen.getAllByRole('heading').map((h) => h.textContent);
    for (const title of [
      'Where money leaked',
      'Exceptions',
      'Trucks needing attention',
      'Fleet right now',
      'The day in numbers',
      'Loaded vs empty running',
      'Who drove well',
      'Who needs a word',
    ])
      expect(headings).toContain(title);
    expect(headings.indexOf('Loaded vs empty running')).toBeLessThan(
      headings.indexOf('Who drove well'),
    );
    expect(screen.queryByText('More operational detail')).not.toBeInTheDocument();
  });

  it('keeps the story text the API sent behind the running card info tip', async () => {
    renderPage();
    await screen.findByText(/A good day/);
    fireEvent.click(screen.getByRole('button', { name: 'About Loaded vs empty running' }));
    expect(
      await screen.findByText(/Most of your distance today carried cement and clinker/),
    ).toBeInTheDocument();
  });

  it('shows the loaded trip count from the story beside the loaded distance', async () => {
    renderPage();
    expect(await screen.findByText(/41 trips/)).toBeInTheDocument();
  });

  it('links the running card to where the API said', async () => {
    renderPage();
    await screen.findByText(/A good day/);
    const card = screen
      .getByRole('heading', { name: 'Loaded vs empty running' })
      .closest('section');
    const link = Array.from(card.querySelectorAll('a')).find((a) => a.textContent.includes('Open'));
    expect(link.getAttribute('href')).toBe('/intelligence?tab=runs');
  });

  it('shows a disconnected account with the button that fixes it', async () => {
    renderPage();
    expect(await screen.findByText(/is disconnected/)).toBeInTheDocument();
    const button = screen.getByRole('link', { name: 'Reconnect' });
    expect(button.getAttribute('href')).toBe('/settings/fleetedge-accounts');
  });

  it('says nothing leaked on a quiet day instead of printing a zero', async () => {
    getDigest.mockResolvedValue({ date: '2026-11-02', headline: '', story: [] });
    renderPage();
    expect(
      await screen.findByText('Nothing was flagged for this day. No leak measured.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/What happened, what it cost and what needs you\./),
    ).toBeInTheDocument();
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
    await screen.findByRole('heading', { name: 'Daily digest' });
    await waitFor(() => expect(listTrips).toHaveBeenCalledTimes(1));
    expect(listTrips.mock.calls[0][0]).toEqual({ status: 'OPEN', limit: 50 });
    expect(screen.getByRole('heading', { name: 'Fleet right now' })).toBeInTheDocument();
    expect(getVehicleList).toHaveBeenCalledTimes(1);
    expect(getMileage).toHaveBeenCalledTimes(1);
  });

  it('changes the report date without reloading current trips or fleet inventory', async () => {
    renderPage();
    await screen.findByText(/A good day: 41 loaded trips, 3 trucks need you\./);
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
    expect(screen.getByRole('heading', { name: 'Fleet right now' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(getDigest).toHaveBeenCalledTimes(2));
    expect(listTrips).toHaveBeenCalledTimes(2);
    expect(getVehicleList).toHaveBeenCalledTimes(2);
    expect(getMileage).toHaveBeenCalledTimes(2);
    expect(refreshLive).toHaveBeenCalledTimes(1);
  });
});
