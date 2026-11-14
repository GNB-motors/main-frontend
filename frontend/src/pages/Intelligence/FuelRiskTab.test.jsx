import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FuelRiskTab from './FuelRiskTab.jsx';
import { listHotspots, getDrainMap } from '../../services/HotspotService.js';

vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: false, loadError: null }),
  GoogleMap: ({ children }) => <div data-testid="google-map">{children}</div>,
  MarkerF: () => null,
  CircleF: () => null,
}));

vi.mock('../../services/HotspotService.js', () => ({
  listHotspots: vi.fn(),
  getDrainMap: vi.fn(),
  provenanceOf: (h) => (h?.orgId ? 'own-manual' : 'network'),
}));

vi.mock('./InstancesTab', () => ({
  default: ({ kind }) => <div data-testid="instances-tab">Instances Log: {kind}</div>,
}));

vi.mock('../PlaceHub/page/useHtmlDark.js', () => ({
  default: () => false,
}));

describe('FuelRiskTab', () => {
  it('opens a Digest fuel link on parked drops rather than current hotspots', async () => {
    render(
      <MemoryRouter initialEntries={['/intelligence?tab=fuel&fuelView=drain']}>
        <FuelRiskTab from="2026-11-04" to="2026-11-04" />
      </MemoryRouter>,
    );
    expect(
      await within(screen.getByRole('group', { name: 'Fuel map layers' })).findByRole('button', {
        name: /^Parked drops/,
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
  beforeEach(() => {
    vi.clearAllMocks();
    listHotspots.mockResolvedValue([
      {
        _id: 'h1',
        name: 'NH16 lay-by',
        centerLat: 22.4,
        centerLng: 88.1,
        radiusM: 500,
        incidentCount: 3,
        active: true,
        orgId: 'org1',
      },
    ]);
    getDrainMap.mockResolvedValue({
      buckets: [
        {
          cell: 'c1',
          centerLat: 22.4,
          centerLng: 88.1,
          count: 2,
          totalLitres: 80,
          estimatedInr: 7200,
          vehicles: ['WB11G0962'],
        },
      ],
      disclaimer: 'Drain map shows estimated drops.',
    });
  });

  it('renders hotspots, KPIs, and opens detail drawer on select', async () => {
    render(
      <MemoryRouter>
        <FuelRiskTab from="2026-10-30T00:00:00Z" to="2026-11-06T00:00:00Z" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('NH16 lay-by')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(screen.getByText('NH16 lay-by'));
    expect(await screen.findByRole('region', { name: 'NH16 lay-by' })).toBeInTheDocument();
  });

  it('pre-selects hotspot when URL includes hotspot search param', async () => {
    render(
      <MemoryRouter initialEntries={['/intelligence?tab=fuel&hotspot=h1']}>
        <FuelRiskTab />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('region', { name: 'NH16 lay-by' })).toBeInTheDocument();
  });

  it('switches between hotspots and drain map', async () => {
    render(
      <MemoryRouter>
        <FuelRiskTab />
      </MemoryRouter>,
    );

    expect(await screen.findByText('NH16 lay-by')).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Fuel map layers' })).getByRole('button', {
        name: /Parked drops/,
      }),
    );
    expect(await screen.findByText(/Drain map shows estimated drops/)).toBeInTheDocument();
    expect(screen.getByText(/80 L · 2 events/)).toBeInTheDocument();
  });

  it('switches to the fuel drops log', async () => {
    render(
      <MemoryRouter>
        <FuelRiskTab />
      </MemoryRouter>,
    );

    expect(await screen.findByText('NH16 lay-by')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Unexplained fuel drops log/ }));
    expect(await screen.findByTestId('instances-tab')).toHaveTextContent(
      'Instances Log: fuel_unexplained',
    );
  });

  it('displays error feedback when hotspots fail to load', async () => {
    listHotspots.mockRejectedValue(new Error('Hotspots fetch failed'));
    render(
      <MemoryRouter>
        <FuelRiskTab />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Couldn't load this/)).toBeInTheDocument();
  });
});
