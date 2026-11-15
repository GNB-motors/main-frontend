import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';

const { getDigest, getDailyFuel, getVehicleList, listTrips, refreshLive, getOwnerReport } =
  vi.hoisted(() => ({
    getOwnerReport: vi.fn(),
    getDigest: vi.fn(),
    getDailyFuel: vi.fn(),
    getVehicleList: vi.fn(),
    listTrips: vi.fn(),
    refreshLive: vi.fn(),
  }));

vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: {
    getDigest,
    getDailyFuel,
    getMorningBrief: vi.fn(async () => ({})),
    getOwnerReport,
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
    getDailyFuel.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishFuel = resolve;
        }),
    );
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Daily digest' })).toBeInTheDocument();
    expect(screen.getByLabelText('Loading actions')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading fuel, last 7 days')).toBeInTheDocument();
    await act(async () => finishReport(digestFixture));
    expect(screen.queryByRole('status', { name: 'Loading actions' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Loading fuel, last 7 days')).toBeInTheDocument();
    await act(async () => finishFuel({ items: [] }));
    expect(
      screen.queryByRole('status', { name: 'Loading fuel, last 7 days' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('No engine consumption readings in this window.')).toBeInTheDocument();
  });
  beforeEach(() => {
    getOwnerReport.mockReset().mockResolvedValue({ sections: [] });
    getDigest.mockReset();
    getDigest.mockResolvedValue(digestFixture);
    getDailyFuel.mockReset().mockResolvedValue({ items: [] });
    getVehicleList.mockReset().mockResolvedValue([{ registrationNumber: 'WB11F0162' }]);
    listTrips.mockReset().mockResolvedValue({ items: [], total: 7 });
    refreshLive.mockReset();
  });

  it('waits for Trips distance instead of flashing a different source first', async () => {
    let finishOwner;
    getOwnerReport.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishOwner = resolve;
        }),
    );
    renderPage();
    const heading = await screen.findByRole('heading', { name: 'Loaded vs empty running' });
    const card = heading.closest('section');
    await waitFor(() => expect(card.querySelector('[role="status"]')).toBeTruthy());
    // Other digest sections may already be loaded; running stays pending.
    expect(card.querySelector('.db-big-number')).toBeNull();
    await act(async () =>
      finishOwner({
        sections: [
          {
            id: 'yesterdaysWork',
            state: 'ok',
            numbers: { loadedKm: null, emptyKm: 72.1, trips: 15, openTrips: 15, kmPartial: true },
          },
        ],
      }),
    );
    await waitFor(() => expect(card.textContent).toContain('72.1 km'));
    expect(card.querySelector('[role="status"]')).toBeNull();
    expect(card.textContent).toContain('Loaded distance is pending for 15 ongoing trips');
    expect(card.querySelector('.db-big-number').textContent).toContain('—');
    expect(card.querySelector('.db-split')).toBeNull();
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
      'Extra fuel costs to review',
      'Exceptions',
      'Trucks needing attention',
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
    const params = new URL(link.getAttribute('href'), 'https://fleet.invalid').searchParams;
    expect(params.get('tab')).toBe('runs');
    expect(params.get('from')).toBe(screen.getByLabelText('Digest date').value);
    expect(params.get('to')).toBe(screen.getByLabelText('Digest date').value);
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
      await screen.findByText('No extra fuel costs were flagged for this day.'),
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

  it('omits the live fleet section and its unused trip and inventory requests', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Daily digest' });
    await screen.findByText(/A good day/);
    expect(listTrips).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Fleet right now' })).not.toBeInTheDocument();
    expect(getVehicleList).not.toHaveBeenCalled();
    expect(getDailyFuel).toHaveBeenCalledTimes(1);
  });

  it('changes the report date without reloading current trips or fleet inventory', async () => {
    renderPage();
    await screen.findByText(/A good day: 41 loaded trips, 3 trucks need you\./);
    fireEvent.change(screen.getByLabelText('Digest date'), { target: { value: '2026-10-30' } });
    await waitFor(() =>
      expect(getDigest).toHaveBeenLastCalledWith(expect.objectContaining({ date: '2026-10-30' })),
    );
    await waitFor(() =>
      expect(getDailyFuel).toHaveBeenLastCalledWith(expect.objectContaining({ day: '2026-10-30' })),
    );
    expect(listTrips).not.toHaveBeenCalled();
    expect(getVehicleList).not.toHaveBeenCalled();
  });

  it('opens the selected seven-day fuel window and restores the Digest date on Back', async () => {
    function Destination() {
      const navigate = useNavigate();
      return <button onClick={() => navigate(-1)}>Back to digest</button>;
    }
    render(
      <MemoryRouter initialEntries={['/digest?date=2026-10-30']}>
        <Routes>
          <Route path="/digest" element={<DailyDigestPage />} />
          <Route path="/mileage" element={<Destination />} />
        </Routes>
      </MemoryRouter>,
    );
    const heading = await screen.findByRole('heading', { name: 'Fuel, last 7 days' });
    expect(screen.getByLabelText('Digest date').value).toBe('2026-10-30');
    const link = heading.closest('section').querySelector('a');
    const params = new URL(link.href).searchParams;
    expect(params.get('from')).toBe('2026-10-24');
    expect(params.get('to')).toBe('2026-10-30');
    fireEvent.click(link);
    fireEvent.click(await screen.findByRole('button', { name: 'Back to digest' }));
    expect(await screen.findByLabelText('Digest date')).toHaveValue('2026-10-30');
    await waitFor(() =>
      expect(getDigest).toHaveBeenLastCalledWith(expect.objectContaining({ date: '2026-10-30' })),
    );
  });

  it('refreshes each owned source once and keeps daily cards visible on report failure', async () => {
    getDigest.mockRejectedValue(new Error('boom'));
    renderPage();
    await screen.findByText(/could not load today/);
    expect(screen.queryByRole('heading', { name: 'Fleet right now' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(getDigest).toHaveBeenCalledTimes(2));
    expect(listTrips).not.toHaveBeenCalled();
    expect(getVehicleList).not.toHaveBeenCalled();
    expect(getDailyFuel).toHaveBeenCalledTimes(2);
    expect(refreshLive).toHaveBeenCalledTimes(1);
  });
});
