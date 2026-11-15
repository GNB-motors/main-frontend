import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OverspeedTab from './OverspeedTab.jsx';
import RouteHubService from '../../services/RouteHubService';

const mockNavigate = vi.fn();

vi.mock('./IntelligenceService', () => ({
  default: {
    getInstances: vi.fn().mockResolvedValue({ summary: { count: 3, totalMin: 15 }, total: 3 }),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/RouteHubService', () => ({
  default: {
    getVehicles: vi.fn(),
    getFleetOverspeed: vi.fn(),
    getOverspeedEvents: vi.fn(),
    getTrail: vi.fn(),
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
    circleMarker: vi.fn(() => ({
      bindTooltip: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
    })),
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

describe('OverspeedTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RouteHubService.getVehicles.mockResolvedValue([
      { _id: 'v1', registrationNumber: 'KA01AB1234', model: 'Tata 407' },
      { _id: 'v2', registrationNumber: 'MH02CD5678', model: 'Eicher Pro' },
    ]);
    RouteHubService.getFleetOverspeed.mockResolvedValue({
      totals: {
        eventCount: 5,
        vehiclesFlagged: 2,
        vehicleCount: 2,
        longestDurationSec: 420,
        peakSpeedKmh: 95,
      },
      vehicles: [
        {
          vehicleId: 'v1',
          registrationNumber: 'KA01AB1234',
          eventCount: 3,
          peakSpeedKmh: 95,
          events: [
            {
              _id: 'e1',
              startAt: '2026-11-06T00:00:00Z',
              endAt: '2026-11-06T00:07:00Z',
              durationSec: 420,
              maxSpeedKmh: 95,
              avgSpeedKmh: 82,
              lat: 12.97,
              lng: 77.59,
            },
          ],
        },
      ],
    });
    RouteHubService.getOverspeedEvents.mockResolvedValue({
      registrationNumber: 'KA01AB1234',
      events: [
        {
          _id: 'e1',
          startAt: '2026-11-06T00:00:00Z',
          endAt: '2026-11-06T00:07:00Z',
          durationSec: 420,
          maxSpeedKmh: 95,
          avgSpeedKmh: 82,
          lat: 12.97,
          lng: 77.59,
        },
      ],
    });
    RouteHubService.getTrail.mockResolvedValue({
      points: [{ eventDateTime: '2026-11-06T00:00:00Z', speed: 85, lat: 12.97, lng: 77.59 }],
    });
  });

  it('renders "Speed audit & traces" by default with KPI stats and vehicle ranking', async () => {
    render(
      <MemoryRouter>
        <OverspeedTab from="2026-11-05" to="2026-11-06" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('tab', { name: /Speed audit & traces/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: /Overspeed moments log/i })).toHaveAttribute(
      'aria-selected',
      'false',
    );

    await waitFor(() => {
      expect(screen.getByText('KA01AB1234')).toBeInTheDocument();
    });
    expect(screen.getByText('95 km/h')).toBeInTheDocument();
  });

  it('switches to "Overspeed moments log" tab on click', async () => {
    render(
      <MemoryRouter>
        <OverspeedTab from="2026-11-05" to="2026-11-06" vehicle="v1" />
      </MemoryRouter>,
    );

    const logTab = screen.getByRole('tab', { name: /Overspeed moments log/i });
    fireEvent.click(logTab);

    expect(logTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('instances-tab')).toBeInTheDocument();
    expect(screen.getByText(/Instances Log: overspeed \(v1\)/i)).toBeInTheDocument();
  });

  it('navigates to live-tracking replay when replay action is triggered', async () => {
    render(
      <MemoryRouter initialEntries={['/intelligence?tab=overspeed&v=v1']}>
        <OverspeedTab from="2026-11-05" to="2026-11-06" vehicle="v1" />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(RouteHubService.getOverspeedEvents).toHaveBeenCalledWith(
        expect.objectContaining({ vehicleId: 'v1' }),
      );
    });

    const replayBtn = await screen.findByRole('button', { name: /Replay/i });
    fireEvent.click(replayBtn);

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/\/live-tracking\?.*v=v1/));
  });
});
