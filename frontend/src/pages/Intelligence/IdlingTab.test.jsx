import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import IdlingTab from './IdlingTab.jsx';
import IdlingConsoleService from '../IdlingConsole/IdlingConsoleService.js';
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

describe('IdlingTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
