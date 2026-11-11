import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FleetListView from './FleetListView.jsx';

vi.mock('../../services/PlaceService', () => ({ resolvePlace: vi.fn().mockResolvedValue(null) }));

/**
 * A failed fleet read must not look like an empty fleet. The rail says what
 * happened and offers the one action that can fix it.
 */
function renderRail(props = {}) {
  return render(
    <FleetListView
      isLiveLoading={false}
      vehicles={[]}
      filteredVehicles={[]}
      counts={{ gps: 0 }}
      setIsRailOpen={() => {}}
      triggerMapResize={() => {}}
      selectedId={null}
      setSelectedId={() => {}}
      {...props}
    />,
  );
}

describe('FleetListView error state', () => {
  it('keeps a never-reported truck visible without a location or fabricated measurements', () => {
    const truck = {
      id: 'new',
      plate: 'WB11E5562',
      status: 'offline',
      neverReported: true,
      hasFix: false,
      hasGpsFix: false,
      lat: null,
      lng: null,
      speed: null,
    };
    renderRail({ vehicles: [truck], filteredVehicles: [truck] });
    expect(screen.getByText('WB11E5562')).toBeTruthy();
    expect(screen.getByText('No telemetry received')).toBeTruthy();
    expect(screen.getByText('GPS position unavailable')).toBeTruthy();
    expect(screen.queryByText('0 km/h')).toBeNull();
  });
  it('says the fleet could not be loaded instead of showing zero vehicles', () => {
    renderRail({ error: new Error('network down') });
    expect(screen.getAllByText("Couldn't load your fleet").length).toBeGreaterThan(0);
    expect(screen.queryByText('0 vehicles · 0 live')).toBeNull();
  });

  it('offers a retry that calls back', () => {
    const onRetry = vi.fn();
    renderRail({ error: new Error('network down'), onRetry });

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('still shows the fleet when the error came with vehicles', () => {
    const vehicle = {
      id: 'v1',
      plate: 'WB01AB1234',
      status: 'moving',
      hasFix: true,
    };
    renderRail({
      error: new Error('stream hiccup'),
      vehicles: [vehicle],
      filteredVehicles: [vehicle],
    });
    expect(screen.queryAllByText("Couldn't load your fleet")).toHaveLength(0);
  });
});

it('shows the original vehicle details alongside speed', async () => {
  const vehicle = {
    id: 'v1',
    plate: 'WB01AB1234',
    status: 'moving',
    hasFix: true,
    lat: 22,
    lng: 88,
    speed: 32,
    manufacturer: 'Tata',
    vin: 'TEST-VIN',
  };
  renderRail({ vehicles: [vehicle], filteredVehicles: [vehicle] });
  expect(await screen.findByText('View current location')).toBeInTheDocument();
  expect(screen.getByText('32 km/h')).toBeInTheDocument();
  expect(screen.getByText('Tata')).toBeInTheDocument();
  expect(screen.getByText('VIN: TEST-VIN')).toBeInTheDocument();
});
