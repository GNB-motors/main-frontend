import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlaceHubPage from './PlaceHubPage.jsx';
import PlaceHubService from './PlaceHubService.js';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../utils/session.js';

vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: false, loadError: null }),
}));
vi.mock('../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../contexts/FeatureFlagsContext', () => ({ useFeatureFlags: vi.fn() }));
vi.mock('../../utils/session.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getUserRole: vi.fn(),
}));
vi.mock('../../components/ui/confirmContext', () => ({ useConfirm: () => async () => true }));
vi.mock('../../components/ui/PlaceLabel', () => ({ default: () => <span>Somewhere</span> }));
vi.mock('./PlaceHubService.js', () => {
  const svc = {
    loadWarehouses: vi.fn(),
    loadZones: vi.fn(),
    loadSites: vi.fn(),
    loadSite: vi.fn(),
    loadHotspots: vi.fn(),
    loadDrainMap: vi.fn(),
    loadLiveIdling: vi.fn(),
    loadIdleHistory: vi.fn(),
    warehouseRoster: vi.fn(),
    createZone: vi.fn(),
    createWarehouse: vi.fn(),
  };
  return { default: svc, PlaceHubService: svc };
});

const ok = (rows) => Promise.resolve({ rows, error: null });

function seed() {
  PlaceHubService.loadWarehouses.mockReturnValue(
    ok([
      {
        _id: 'w1',
        name: 'Dankuni yard',
        lat: 22.68,
        lng: 88.29,
        geofenceRadiusM: 300,
        geofenceZoneId: 'zm',
        vehicleCount: 4,
      },
    ]),
  );
  PlaceHubService.loadZones.mockReturnValue(
    ok([
      { _id: 'zm', name: 'Warehouse: Dankuni yard', lat: 22.68, lng: 88.29, radiusMetres: 300 },
      {
        _id: 'z1',
        name: 'Tata gate 3',
        lat: 22.8,
        lng: 86.2,
        radiusMetres: 400,
        geofenceType: 'circular',
      },
    ]),
  );
  PlaceHubService.loadSites.mockReturnValue(
    ok([
      {
        _id: 's1',
        name: 'Maybe a dhaba',
        siteType: 'DHABA',
        status: 'PROPOSED',
        centroidLat: 23,
        centroidLng: 87,
        radiusM: 100,
      },
    ]),
  );
  PlaceHubService.loadHotspots.mockReturnValue(
    ok([
      {
        _id: 'h1',
        orgId: 'o',
        source: 'MANUAL',
        name: 'NH16 lay-by',
        centerLat: 21,
        centerLng: 86,
        incidentCount: 3,
      },
    ]),
  );
  PlaceHubService.loadDrainMap.mockReturnValue(ok({ buckets: [] }));
  PlaceHubService.loadLiveIdling.mockReturnValue(
    ok([
      {
        _id: 'e1',
        registrationNumber: 'WB11G0962',
        lat: 22.6,
        lng: 88.3,
        durationMin: 42,
        rupees: 210,
        legitimacy: 'excess',
        startAt: '2026-10-08T10:00:00Z',
      },
    ]),
  );
  PlaceHubService.loadIdleHistory.mockResolvedValue({ rows: [], error: null, truncated: false });
  PlaceHubService.warehouseRoster.mockResolvedValue({ inside: [] });
}

function renderPage(path = '/place-hub') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PlaceHubPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  seed();
  useFeatureFlags.mockReturnValue({ isEnabled: () => true, ready: true });
  getUserRole.mockReturnValue('OWNER');
});

describe('PlaceHubPage', () => {
  it('lists every place once — the warehouse mirror zone is folded away', async () => {
    renderPage();
    const list = await screen.findByRole('list');
    expect(within(list).getByText('Dankuni yard')).toBeInTheDocument();
    expect(within(list).getByText('Tata gate 3')).toBeInTheDocument();
    expect(within(list).queryByText('Warehouse: Dankuni yard')).not.toBeInTheDocument();
    // Suggestions wait under "To review" instead of crowding "All places".
    expect(within(list).queryByText('Maybe a dhaba')).not.toBeInTheDocument();
    expect(within(list).getAllByRole('button')).toHaveLength(2);
  });

  it('opens the detail in its own column, not over the map', async () => {
    const { container } = renderPage();
    const body = container.querySelector('.ph-body');
    expect(body).not.toHaveClass('has-panel');
    fireEvent.click(await screen.findByText('Tata gate 3'));
    expect(body).toHaveClass('has-panel');
    expect(container.querySelector('.ph-mapwrap .ph-panel')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(body).not.toHaveClass('has-panel');
  });

  it('opens a place in the drawer', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Tata gate 3'));
    const drawer = screen.getByRole('complementary', { name: 'Tata gate 3' });
    expect(within(drawer).getByRole('button', { name: /Edit/ })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: /Delete/ })).toBeInTheDocument();
  });

  it('asks about a proposed place instead of offering edit', async () => {
    renderPage();
    await screen.findByText('Dankuni yard');
    fireEvent.click(screen.getByRole('tab', { name: /To review/ }));
    fireEvent.click(await screen.findByText('Maybe a dhaba'));
    const drawer = screen.getByRole('complementary', { name: 'Maybe a dhaba' });
    expect(within(drawer).getByText('Is this a real place?')).toBeInTheDocument();
    expect(within(drawer).queryByRole('button', { name: /Edit/ })).not.toBeInTheDocument();
  });

  it('opens the place a link names, under the list it belongs to', async () => {
    renderPage('/place-hub?place=site%3As1');
    expect(await screen.findByRole('complementary', { name: 'Maybe a dhaba' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /To review/ })).toHaveAttribute('aria-selected', 'true');
    expect(PlaceHubService.loadSite).not.toHaveBeenCalled();
  });

  it('fetches a linked suggestion that is not among those loaded', async () => {
    PlaceHubService.loadSite.mockResolvedValue({
      _id: 's9',
      siteType: 'UNKNOWN',
      status: 'PROPOSED',
      centroidLat: 22.6,
      centroidLng: 88.2,
      radiusM: 100,
    });
    renderPage('/place-hub?place=site%3As9');
    expect(await screen.findByRole('complementary', { name: 'Unknown' })).toBeInTheDocument();
    expect(PlaceHubService.loadSite).toHaveBeenCalledWith('s9');
  });

  it('adds a zone only once it has a name and a pin', async () => {
    renderPage();
    await screen.findByText('Dankuni yard');
    fireEvent.click(screen.getByRole('button', { name: /Add place/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Geofence zone/ }));
    expect(screen.getByRole('heading', { name: 'Add geofence zone' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save place' }));
    expect(await screen.findByText('Give the place a name')).toBeInTheDocument();
    expect(screen.getByText('Click the map or search to drop a pin')).toBeInTheDocument();
    expect(PlaceHubService.createZone).not.toHaveBeenCalled();
  });

  it('shows live idling and fuel hotspots on their tabs', async () => {
    renderPage('/place-hub?tab=idling');
    expect(await screen.findByText('WB11G0962')).toBeInTheDocument();
    expect(screen.getByText('Excess')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Fuel risk/ }));
    expect(await screen.findByText('NH16 lay-by')).toBeInTheDocument();
  });

  it('keeps manager-only views and editing away from other roles', async () => {
    getUserRole.mockReturnValue('DRIVER');
    renderPage('/place-hub?tab=idling');
    expect(await screen.findByText('Dankuni yard')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Idling/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add place/ })).not.toBeInTheDocument();
    expect(PlaceHubService.loadSites).not.toHaveBeenCalled();
    expect(PlaceHubService.loadLiveIdling).not.toHaveBeenCalled();
  });
});
