import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

// Navigation is exercised here; each tab's API and contents have dedicated tests.
vi.mock('./ReportCardsTab', () => ({ default: ({ headerControl }) => <div>{headerControl}</div> }));
vi.mock('./IdlingTab', () => ({ default: () => <div>Idling view</div> }));
vi.mock('./OverspeedTab', () => ({ default: () => <div>Overspeed view</div> }));
vi.mock('./FuelRiskTab', () => ({ default: () => <div>Fuel checks view</div> }));
vi.mock('@/pages/Trip/services/TripService', () => ({
  default: {
    getDrivers: vi.fn().mockResolvedValue({ data: [] }),
    getVehicles: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('./IntelligenceService', () => ({
  default: {
    getSummary: vi.fn(),
    getIssues: vi.fn(),
    getReportCards: vi.fn(),
    getInstances: vi.fn(),
    getMileage: vi.fn(),
    getAutoTrips: vi.fn(),
    getTripsHistory: vi.fn(),
    getPlaceQuestions: vi.fn(),
  },
}));

import IntelligenceService from './IntelligenceService';
import IntelligencePage from './IntelligencePage';

const summary = {
  period: { from: '2026-10-27T18:30:00Z', to: '2026-11-02T18:30:00Z' },
  fleet: { trucks: 124, reporting: 118, disconnected: 6 },
  runs: {
    loadedKm: 42180,
    emptyKm: 8420,
    repositionKm: 12600,
    loadedTrips: 268,
    plantToPlant: 966,
    emptySharePct: 13.3,
    why: { text: 'Plants work like warehouses.' },
  },
  tiles: [
    {
      key: 'idling',
      label: 'Idling',
      value: '112 h',
      severity: 'watch',
      why: { text: 'Engine on, not moving.' },
      link: { label: 'See the idles', to: '/intelligence?tab=idling' },
    },
  ],
};

const noIssues = { items: [], total: 0, counts: { good: 0, info: 0, watch: 0, act: 0 } };
const withIssues = {
  items: [
    {
      id: 'iss-81',
      kind: 'ACCOUNT_DISCONNECTED',
      severity: 'act',
      title: 'FleetEdge account stopped sending data',
      detail: 'No report from 4 trucks.',
      advice: 'Re-link the account.',
      firstSeenAt: '2026-11-01T09:00:00Z',
      lastSeenAt: '2026-11-02T18:30:00Z',
      occurrences: 1,
      evidence: [],
      action: null,
    },
  ],
  total: 1,
  counts: { good: 0, info: 0, watch: 0, act: 1 },
};

function LocationDisplay() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <span data-testid="location">{`${location.pathname}${location.search}`}</span>
      <button type="button" onClick={() => navigate(-1)}>
        Go back
      </button>
    </>
  );
}

function renderPage(entry = '/intelligence') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocationDisplay />
      <Routes>
        <Route path="/intelligence" element={<IntelligencePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('IntelligencePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    IntelligenceService.getSummary.mockResolvedValue(summary);
    IntelligenceService.getIssues.mockResolvedValue(noIssues);
    IntelligenceService.getReportCards.mockResolvedValue({ items: [] });
    IntelligenceService.getInstances.mockResolvedValue({ summary: null, items: [], total: 0 });
    IntelligenceService.getMileage.mockResolvedValue({ items: [] });
    IntelligenceService.getAutoTrips.mockResolvedValue({ items: [] });
    IntelligenceService.getTripsHistory.mockResolvedValue({ items: [], countsByPlace: [] });
    IntelligenceService.getPlaceQuestions.mockResolvedValue({ items: [], total: 0 });
  });

  it('shows the title, the five sections, and every tab inside its section', async () => {
    renderPage('/intelligence?tab=issues');

    expect(screen.getByText('Intelligence')).toBeInTheDocument();
    expect(
      screen.getByText(/What your trucks and drivers did, and what needs you/),
    ).toBeInTheDocument();
    const sections = {
      Issues: [],
      'Trucks & drivers': ['Trucks', 'Drivers'],
      Driving: ['Idling', 'Overspeed', 'Cruise & gears', 'Detours'],
      'Fuel & DEF': ['Fuel checks', 'Mileage & DEF'],
      'Runs & places': ['Loaded & empty runs', 'Places'],
    };
    for (const [section, tabs] of Object.entries(sections)) {
      fireEvent.click(await screen.findByRole('tab', { name: new RegExp(`^${section}`) }));
      for (const label of tabs) {
        expect(await screen.findByRole('tab', { name: label })).toBeInTheDocument();
      }
    }
  });

  it('shows the period at a glance from the issues and the instances', async () => {
    IntelligenceService.getIssues.mockResolvedValue(withIssues);
    IntelligenceService.getInstances.mockImplementation(({ kind }) =>
      Promise.resolve(
        kind === 'overspeed'
          ? {
              summary: { count: 7, totalMin: 95, why: { text: 'From the GPS trail.' } },
              items: [],
              total: 7,
            }
          : { summary: null, items: [], total: 0 },
      ),
    );
    renderPage('/intelligence?tab=issues');

    const glance = await screen.findByRole('region', { name: 'This period at a glance' });
    await waitFor(() => expect(glance).toHaveTextContent('Needs you1'));
    expect(glance).toHaveTextContent('124of 124');
    expect(glance).toHaveTextContent('1 h 35 min over the limit');
    expect(glance).toHaveTextContent('Not available for this period');
  });

  it('draws no summary box at all while the summary endpoint is not deployed', async () => {
    IntelligenceService.getSummary.mockRejectedValue(
      Object.assign(new Error('Not found'), { status: 404 }),
    );
    renderPage();
    await waitFor(() => expect(IntelligenceService.getSummary).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.queryByText(/The summary of this period is being built/),
      ).not.toBeInTheDocument(),
    );
  });

  it('shows no "All 0" chips while the issues endpoint is not deployed', async () => {
    IntelligenceService.getIssues.mockRejectedValue(
      Object.assign(new Error('Not found'), { status: 404 }),
    );
    renderPage('/intelligence?tab=issues');
    expect(await screen.findByText(/being built/)).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Filter the issues' })).not.toBeInTheDocument();
  });

  it('opens on the issues when something needs the owner', async () => {
    IntelligenceService.getIssues.mockResolvedValue(withIssues);

    renderPage();

    await waitFor(() =>
      expect(IntelligenceService.getIssues).toHaveBeenCalledWith(
        expect.objectContaining({ from: expect.any(String), to: expect.any(String) }),
      ),
    );
    expect(await screen.findByRole('tab', { name: /Issues/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('opens on the trucks when nothing needs the owner', async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Trucks' })).toHaveAttribute('aria-selected', 'true'),
    );
  });

  it('opens on the tab the URL asks for', async () => {
    renderPage('/intelligence?tab=mileage');

    await waitFor(() =>
      expect(screen.getByRole('tab', { name: /Mileage & DEF/ })).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    );
  });

  it('writes the tab into the URL when a tab is clicked', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('tab', { name: 'Driving' }));
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/intelligence?tab=idling'),
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Overspeed' }));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/intelligence?tab=overspeed'),
    );
  });

  it('writes the period into the URL when a period is picked', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Last 30 days' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('from='));
  });

  it('goes back to the tab the owner came from', async () => {
    renderPage('/intelligence?tab=overspeed');

    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Overspeed' })).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Runs & places' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('tab=runs'));

    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('tab=overspeed'));
    expect(screen.getByRole('tab', { name: 'Overspeed' })).toHaveAttribute('aria-selected', 'true');
  });
});
