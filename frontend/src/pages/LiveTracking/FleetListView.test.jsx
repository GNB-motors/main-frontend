import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FleetListView from './FleetListView.jsx';

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
    renderRail({ error: new Error('stream hiccup'), vehicles: [vehicle], filteredVehicles: [vehicle] });
    expect(screen.queryAllByText("Couldn't load your fleet")).toHaveLength(0);
  });
});
