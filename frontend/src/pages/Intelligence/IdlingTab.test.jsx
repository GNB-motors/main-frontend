import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import IdlingTab from './IdlingTab.jsx';
import IdlingConsoleService from '../IdlingConsole/IdlingConsoleService.js';
import DriverVehicleAssignmentService from '@/services/DriverVehicleAssignmentService';
import PlaceHubService from '../PlaceHub/PlaceHubService.js';

vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: false, loadError: null }),
  GoogleMap: ({ children }) => <div data-testid="google-map">{children}</div>,
  MarkerF: () => null,
}));

vi.mock('../IdlingConsole/IdlingConsoleService.js', () => ({
  default: {
    getLive: vi.fn(),
    getHistory: vi.fn(),
  },
}));

vi.mock('../PlaceHub/PlaceHubService.js', () => ({
  default: {
    loadIdleSetting: vi.fn(),
  },
}));

vi.mock('./InstancesTab', () => ({
  default: ({ kind }) => <div data-testid="instances-tab">Instances Log: {kind}</div>,
}));

vi.mock('../PlaceHub/page/useHtmlDark.js', () => ({
  default: () => false,
}));

vi.mock('@/services/DriverVehicleAssignmentService', () => ({
  default: { getAssignmentPage: vi.fn() },
}));

describe('IdlingTab', () => {
  it('opens a Digest idling link on recorded history rather than live idling', async () => {
    render(
      <MemoryRouter initialEntries={['/intelligence?tab=idling&idleView=spots']}>
        <IdlingTab from="2026-11-04" to="2026-11-04" />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('tab', { name: /Idle spots/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
  beforeEach(() => {
    vi.clearAllMocks();
    DriverVehicleAssignmentService.getAssignmentPage.mockResolvedValue({
      results: [],
      meta: { totalPages: 1 },
    });
    IdlingConsoleService.getLive.mockResolvedValue([
      {
        _id: 'live1',
        registrationNumber: 'WB11G0962',
        durationMin: 45,
        rupees: 450,
        litres: 4.5,
        legitimacy: 'excess',
        lat: 22.5,
        lng: 88.3,
        zoneName: null,
        startAt: '2026-11-06T00:00:00Z',
      },
    ]);
    IdlingConsoleService.getHistory.mockResolvedValue({
      data: [
        {
          _id: 'hist1',
          registrationNumber: 'WB11G0962',
          durationMin: 30,
          rupees: 300,
          legitimacy: 'excess',
          lat: 22.5,
          lng: 88.3,
          startAt: '2026-11-05T10:00:00Z',
          endAt: '2026-11-05T10:30:00Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    PlaceHubService.loadIdleSetting.mockResolvedValue({
      idleThresholdMin: 20,
      idleThresholdSource: 'CUSTOM',
    });
  });

  it('shows a period read and requests the selected end date', async () => {
    render(
      <MemoryRouter>
        <IdlingTab from="2026-10-30T00:00:00Z" to="2026-11-06T00:00:00Z" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('region', { name: 'Idling period read' })).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /Closed idle events 1 Selected period/ }),
    ).toBeInTheDocument();
    expect(IdlingConsoleService.getHistory).toHaveBeenCalledWith(
      expect.objectContaining({ to: '2026-11-06T00:00:00Z' }),
      expect.any(Object),
    );
  });

  it('renders live idling vehicles, KPIs, and threshold rule link', async () => {
    render(
      <MemoryRouter>
        <IdlingTab from="2026-10-30T00:00:00Z" to="2026-11-06T00:00:00Z" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('WB11G0962')).toBeInTheDocument();
    expect(screen.getByText('Excess')).toBeInTheDocument();
    expect(screen.getByText('20 min')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Change' })).toHaveAttribute(
      'href',
      '/settings?section=idling',
    );
  });

  it('switches between live now and 7-day idle spots', async () => {
    render(
      <MemoryRouter>
        <IdlingTab />
      </MemoryRouter>,
    );

    expect(await screen.findByText('WB11G0962')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Idle spots · 7 days/ }));
    expect(await screen.findByText(/1 idles/)).toBeInTheDocument();
  });

  it('switches to the idle moments log', async () => {
    render(
      <MemoryRouter>
        <IdlingTab />
      </MemoryRouter>,
    );

    expect(await screen.findByText('WB11G0962')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Idle moments log/ }));
    expect(await screen.findByTestId('instances-tab')).toHaveTextContent('Instances Log: idle');
  });

  it('opens detail drawer when an idle vehicle is selected', async () => {
    render(
      <MemoryRouter>
        <IdlingTab />
      </MemoryRouter>,
    );

    const vehicleRow = await screen.findByText('WB11G0962');
    fireEvent.click(vehicleRow);
    expect(await screen.findByRole('complementary', { name: 'WB11G0962' })).toBeInTheDocument();
    expect(screen.getByText('Burned so far')).toBeInTheDocument();
  });

  it('displays error feedback when live idling fails', async () => {
    IdlingConsoleService.getLive.mockRejectedValue(new Error('Network error'));
    render(
      <MemoryRouter>
        <IdlingTab />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/Some idling data could not load \(live idling\)/),
    ).toBeInTheDocument();
  });
  it('filters the map, lists and period read to the selected driver', async () => {
    IdlingConsoleService.getLive.mockResolvedValue([
      {
        _id: '1',
        registrationNumber: 'WB11T0662',
        driverId: 'driver1',
        startAt: '2026-11-01T00:00:00Z',
        durationMin: 45,
      },
      {
        _id: '2',
        registrationNumber: 'WB11T0999',
        driverId: 'driver2',
        startAt: '2026-11-01T00:00:00Z',
        durationMin: 45,
      },
    ]);
    render(
      <MemoryRouter>
        <IdlingTab driver="driver1" from="2026-11-01" to="2026-11-07" />
      </MemoryRouter>,
    );
    expect(await screen.findByText('WB11T0662')).toBeInTheDocument();
    expect(screen.queryByText('WB11T0999')).not.toBeInTheDocument();
    expect(screen.queryByText('WB11G0962')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Idling now 1/ })).toBeInTheDocument();
    expect(DriverVehicleAssignmentService.getAssignmentPage).toHaveBeenCalledWith(
      expect.objectContaining({ driverId: 'driver1', includePast: true }),
      expect.any(Object),
    );
  });
  it('loads all assignment pages before attributing events without a recorded driver', async () => {
    DriverVehicleAssignmentService.getAssignmentPage
      .mockResolvedValueOnce({ results: [], meta: { totalPages: 2 } })
      .mockResolvedValueOnce({
        results: [
          {
            driverId: 'driver1',
            vehicleId: { _id: 'truck1', registrationNumber: 'WB11G0962' },
            startDate: '2026-11-01T00:00:00Z',
            endDate: null,
          },
        ],
        meta: { totalPages: 2 },
      });
    render(
      <MemoryRouter>
        <IdlingTab driver="driver1" />
      </MemoryRouter>,
    );
    expect(await screen.findByText('WB11G0962')).toBeInTheDocument();
    expect(DriverVehicleAssignmentService.getAssignmentPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
      expect.any(Object),
    );
    expect(screen.getByRole('button', { name: /Closed idle events 1/ })).toBeInTheDocument();
  });
  it('shows unavailable totals and a retry when driver attribution cannot load', async () => {
    DriverVehicleAssignmentService.getAssignmentPage.mockRejectedValue(new Error('Offline'));
    render(
      <MemoryRouter>
        <IdlingTab driver="driver1" />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Idling totals for this driver are unavailable',
    );
    expect(screen.queryByText('No truck is idling right now')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry driver idling' })).toBeInTheDocument();
  });
});
