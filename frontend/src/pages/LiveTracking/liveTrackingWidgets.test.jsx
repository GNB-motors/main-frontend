import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import LiveClock from './LiveClock';
import TelemetryTicker from './TelemetryTicker';
import { countVehiclesByStatus } from './liveTracking.shared';

afterEach(() => {
  vi.useRealTimers();
});

describe('countVehiclesByStatus', () => {
  it('counts every status card in one pass, with the same rules as before', () => {
    const counts = countVehiclesByStatus([
      { status: 'moving', live: true },
      { status: 'moving', live: true, alertsCount: 2 },
      { status: 'stopped', inGeofenceAlert: true },
      { status: 'idling', live: true },
      { status: 'offline' },
      { status: 'workshop' },
      { status: 'stopped', isBreakdown: true, hasFault: true },
    ]);
    expect(counts).toEqual({
      all: 7,
      moving: 2,
      stopped: 2,
      idling: 1,
      offline: 1,
      breakdown: 2,
      faulty: 2,
      geofence: 1,
      gps: 3,
    });
  });

  it('is all zeros for an empty fleet', () => {
    expect(countVehiclesByStatus([]).all).toBe(0);
  });
});

describe('LiveClock', () => {
  // The topbar said "IST" but printed the browser's local time.
  it('shows IST whatever the browser timezone, and ticks every 15 s', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T21:05:00Z'));
    render(<LiveClock />);
    expect(screen.getByText('02:35 am IST')).toBeInTheDocument();
    act(() => {
      vi.setSystemTime(new Date('2026-10-08T21:20:00Z'));
      vi.advanceTimersByTime(15000);
    });
    expect(screen.getByText('02:50 am IST')).toBeInTheDocument();
  });
});

describe('TelemetryTicker', () => {
  const fleet = [
    { plate: 'WB01', live: true, speed: 40 },
    { plate: 'WB02', live: false, speed: 0 },
    { plate: 'WB03', live: true, speed: 55 },
  ];

  it('rotates through the live vehicles only', () => {
    vi.useFakeTimers();
    render(<TelemetryTicker vehicles={fleet} rotating highlighted icon={null} />);
    expect(screen.getByText('WB01')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3200));
    expect(screen.getByText('WB03')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3200));
    expect(screen.getByText('WB01')).toBeInTheDocument();
  });

  it('pins the selected vehicle and renders nothing when none is live', () => {
    const { rerender, container } = render(
      <TelemetryTicker selectedVehicle={fleet[1]} vehicles={fleet} rotating icon={null} />,
    );
    expect(screen.getByText('WB02')).toBeInTheDocument();
    rerender(<TelemetryTicker vehicles={[fleet[1]]} rotating icon={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
