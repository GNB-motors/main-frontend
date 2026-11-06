import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DetoursTab from './DetoursTab.jsx';
import RouteHubService from '../../services/RouteHubService';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/RouteHubService', () => ({
  default: {
    getDeviationEvents: vi.fn(),
    getDeviationEvent: vi.fn(),
    reviewDeviationEvent: vi.fn(),
  },
}));

vi.mock('../RouteHub/routeHubMap', () => ({
  useLeafletMap: () => ({
    containerRef: { current: null },
    mapRef: { current: { setView: vi.fn(), fitBounds: vi.fn(), invalidateSize: vi.fn() } },
  }),
  useLayerGroup: () => {},
  L: {
    latLngBounds: vi.fn(() => ({ pad: () => ({ isValid: () => false }) })),
    circleMarker: vi.fn(() => ({ bindTooltip: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis() })),
    polyline: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
  },
}));

vi.mock('./InstancesTab', () => ({
  default: ({ kind, vehicle }) => (
    <div data-testid="instances-tab">
      Instances Log: {kind} ({vehicle || 'all'})
    </div>
  ),
}));

describe('DetoursTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RouteHubService.getDeviationEvents.mockResolvedValue({
      total: 1,
      page: 1,
      pageSize: 100,
      events: [
        {
          _id: 'dev-1',
          vehicleId: 'v1',
          registrationNumber: 'KA01AB1234',
          tripId: 'trip-101',
          legName: 'Bangalore to Chennai',
          startedAt: '2026-11-06T01:00:00Z',
          endedAt: '2026-11-06T01:45:00Z',
          durationMinutes: 45,
          extraKm: 18.5,
          status: 'open',
          costEstimated: 1250,
        },
      ],
    });
    RouteHubService.getDeviationEvent.mockResolvedValue({
      _id: 'dev-1',
      vehicleId: 'v1',
      registrationNumber: 'KA01AB1234',
      status: 'open',
    });
  });

  it('renders "Route deviation audit" by default with DeviationView', async () => {
    render(
      <MemoryRouter>
        <DetoursTab from="2026-11-05" to="2026-11-06" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('tab', { name: /Route deviation audit/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: /Detour moments log/i })).toHaveAttribute(
      'aria-selected',
      'false',
    );

    await waitFor(() => {
      expect(RouteHubService.getDeviationEvents).toHaveBeenCalled();
    });
  });

  it('switches to "Detour moments log" tab on click', async () => {
    render(
      <MemoryRouter>
        <DetoursTab from="2026-11-05" to="2026-11-06" vehicle="v1" />
      </MemoryRouter>,
    );

    const logTab = screen.getByRole('tab', { name: /Detour moments log/i });
    fireEvent.click(logTab);

    expect(logTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('instances-tab')).toBeInTheDocument();
    expect(screen.getByText(/Instances Log: detour \(v1\)/i)).toBeInTheDocument();
  });
});

