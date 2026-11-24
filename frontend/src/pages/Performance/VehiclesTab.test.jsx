import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import VehiclesTab from './VehiclesTab';
import PerformanceApi from '../../api/performance';

vi.mock('../../api/performance', () => ({
  default: {
    vehicles: vi.fn(),
    vehicle: vi.fn(),
  },
}));

const measured = (value, unit) => ({
  value,
  unit,
  source: 'measured',
  uncertainty: null,
  reason: null,
});
const gated = (minutes) => ({
  value: null,
  unit: '%',
  source: 'not_comparable',
  uncertainty: null,
  reason: `cadence P90 ${minutes} min > 90 s`,
});

const truck = (registration, overrides = {}) => ({
  vehicleKey: `key-${registration}`,
  vehicleId: `key-${registration}`,
  registration,
  provider: 'TATA',
  kmPerL: measured(5.26, 'km/L'),
  idlePct: measured(10.1, '%'),
  topGearPct: gated(63),
  overRevPct: gated(63),
  healthFindings: 0,
  ...overrides,
});

const WINDOW = { from: '2026-10-23', to: '2026-11-21', days: 30 };

const renderTab = () =>
  render(
    <MemoryRouter>
      <VehiclesTab />
    </MemoryRouter>,
  );

describe('VehiclesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PerformanceApi.vehicles.mockResolvedValue({
      window: WINDOW,
      vehicles: [
        truck('BR44GB1162'),
        truck('WB11S6362', {
          idlePct: {
            value: null,
            unit: '%',
            source: 'insufficient_data',
            uncertainty: null,
            reason: 'the truck does not report idle time',
          },
          healthFindings: 2,
        }),
      ],
    });
    PerformanceApi.vehicle.mockResolvedValue({
      vehicle: truck('BR44GB1162'),
      gearRpm: { gearPct: { g1: gated(63), g2: gated(63) }, rpmBandPct: {} },
      health: [],
      efficiencyDrift: {
        series: [
          { istDay: '2026-11-19', kmPerL: measured(5.1, 'km/L') },
          {
            istDay: '2026-11-20',
            kmPerL: {
              value: null,
              unit: 'km/L',
              source: 'insufficient_data',
              uncertainty: null,
              reason: 'no fuel reading that day',
            },
          },
        ],
        driftPct: measured(-3.2, '%'),
      },
      harshEvents: [],
    });
  });

  it('leaves out the columns no truck can fill and says why once, in the briefing', async () => {
    renderTab();

    const table = await screen.findByRole('table');
    expect(within(table).queryByText('Top-gear share')).toBeNull();
    expect(within(table).queryByText('Over-rev share')).toBeNull();
    expect(within(table).getByText('Mileage')).toBeTruthy();

    const briefing = screen.getByRole('region', { name: 'Truck performance read' });
    expect(briefing.textContent).toContain(
      'Top-gear share and over-rev share are not shown: readings arrive up to 63 min apart; this needs one at least every 90 s.',
    );
    expect(screen.queryByRole('region', { name: 'Missing numbers' })).toBeNull();
    expect(screen.queryByText(/is missing for/)).toBeNull();
    expect(screen.queryByText(/not comparable/i)).toBeNull();
    expect(screen.queryByText(/cadence P90/)).toBeNull();
  });

  it('shows one empty state instead of a table when no truck has any number', async () => {
    PerformanceApi.vehicles.mockResolvedValue({
      window: WINDOW,
      vehicles: [
        truck('BR44GB1162', {
          kmPerL: {
            value: null,
            unit: 'km/L',
            source: 'measured',
            uncertainty: null,
            reason: 'the truck reported no fuel or distance in this window',
          },
          idlePct: {
            value: null,
            unit: '%',
            source: 'insufficient_data',
            uncertainty: null,
            reason: 'the truck does not report idle time',
          },
        }),
      ],
    });
    renderTab();

    const empty = await screen.findByRole('region', { name: /No truck numbers/ });
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Truck performance read' })).toBeNull();
    expect(empty.textContent).toContain('No fuel or distance reported in this window.');
    expect(empty.textContent).toContain('Idle time is not reported.');
  });

  it('opens with a briefing built from the numbers there are', async () => {
    renderTab();

    const briefing = await screen.findByRole('region', { name: 'Truck performance read' });
    expect(briefing.textContent).toContain('2 trucks on this page.');
    expect(briefing.textContent).toContain('5.26 km/L');
    expect(within(briefing).getByText('Performance health findings')).toBeTruthy();
    expect(screen.getByText('2 alerts')).toBeTruthy();
  });

  it('counts what the search leaves on screen', async () => {
    renderTab();

    fireEvent.change(await screen.findByRole('searchbox', { name: 'Search a plate' }), {
      target: { value: 'WB11' },
    });

    expect(screen.getByText('1 of 2 trucks')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Open BR44GB1162' })).toBeNull();
  });

  it('opens the truck drawer from its row', async () => {
    renderTab();

    fireEvent.click(await screen.findByRole('button', { name: 'Open BR44GB1162' }));

    await waitFor(() => expect(PerformanceApi.vehicle).toHaveBeenCalled());
    expect(PerformanceApi.vehicle.mock.calls[0][0]).toBe('key-BR44GB1162');
    const drawer = await screen.findByRole('dialog');
    await within(drawer).findByText('Drift against its own baseline:', { exact: false });
    expect(
      within(drawer).getByText(/Not comparable\. Readings arrive up to 63 min apart/),
    ).toBeTruthy();
    expect(within(drawer).getByRole('link', { name: 'Open in tracking →' })).toBeTruthy();
  });

  it('loads trucks beyond the first page using the server offset', async () => {
    PerformanceApi.vehicles.mockImplementation(async ({ offset }) => ({
      window: WINDOW,
      total: 51,
      vehicles: offset
        ? [truck('BR-LATER')]
        : Array.from({ length: 50 }, (_, i) => truck(`WB${String(i).padStart(4, '0')}`)),
    }));
    renderTab();
    fireEvent.click(await screen.findByRole('button', { name: 'Next trucks' }));
    expect(await screen.findByRole('button', { name: 'Open BR-LATER' })).toBeInTheDocument();
    expect(PerformanceApi.vehicles).toHaveBeenLastCalledWith(
      { offset: 50 },
      expect.any(AbortSignal),
    );
    expect(screen.getByRole('button', { name: 'Next trucks' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Previous trucks' }));
    expect(await screen.findByRole('button', { name: 'Open WB0000' })).toBeInTheDocument();
  });
});
