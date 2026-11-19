import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlacesListView from './PlacesListView.jsx';

const mockTrackPlaces = {
  places: [
    { id: 'plant-1', name: 'Cement Factory', type: 'PLANT', visitCount: 5 },
    { id: 'pump-used', name: 'HP Fuel Station', type: 'FUEL_PUMP', visitCount: 12 },
    { id: 'pump-unused', name: 'IndianOil Pump', type: 'FUEL_PUMP', visitCount: 0 },
  ],
  listPlaces: [
    { id: 'plant-1', name: 'Cement Factory', type: 'PLANT', visitCount: 5 },
    { id: 'pump-used', name: 'HP Fuel Station', type: 'FUEL_PUMP', visitCount: 12 },
    { id: 'pump-unused', name: 'IndianOil Pump', type: 'FUEL_PUMP', visitCount: 0 },
  ],
  loading: false,
  loaded: true,
  notice: null,
  counts: { plant: 1, pump: 2 },
  hiddenGroups: new Set(),
  toggleGroup: vi.fn(),
  retry: vi.fn(),
};

describe('PlacesListView', () => {
  it('by default hides petrol pumps that have not been visited', () => {
    const onPick = vi.fn();
    render(
      <PlacesListView
        trackPlaces={mockTrackPlaces}
        vehicles={[]}
        onPick={onPick}
        showAllPumps={false}
      />,
    );

    expect(screen.getByText('Cement Factory')).toBeInTheDocument();
    expect(screen.getByText('HP Fuel Station')).toBeInTheDocument();
    expect(screen.queryByText('IndianOil Pump')).not.toBeInTheDocument();
  });

  it('shows all petrol pumps when showAllPumps is true', () => {
    const onPick = vi.fn();
    render(
      <PlacesListView
        trackPlaces={mockTrackPlaces}
        vehicles={[]}
        onPick={onPick}
        showAllPumps={true}
      />,
    );

    expect(screen.getByText('Cement Factory')).toBeInTheDocument();
    expect(screen.getByText('HP Fuel Station')).toBeInTheDocument();
    expect(screen.getByText('IndianOil Pump')).toBeInTheDocument();
  });

  it('toggles petrol pump view mode when toggle switch is clicked', () => {
    const onToggle = vi.fn();
    render(
      <PlacesListView
        trackPlaces={mockTrackPlaces}
        vehicles={[]}
        onPick={vi.fn()}
        showAllPumps={false}
        onToggleAllPumps={onToggle}
      />,
    );

    const toggleBtn = screen.getByRole('switch', { name: /Show all petrol pumps around/i });
    expect(toggleBtn).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('invokes onPick when a place card is clicked', () => {
    const onPick = vi.fn();
    render(
      <PlacesListView
        trackPlaces={mockTrackPlaces}
        vehicles={[]}
        onPick={onPick}
        showAllPumps={false}
      />,
    );

    fireEvent.click(screen.getByText('HP Fuel Station'));
    expect(onPick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pump-used', name: 'HP Fuel Station' }),
    );
  });
});
