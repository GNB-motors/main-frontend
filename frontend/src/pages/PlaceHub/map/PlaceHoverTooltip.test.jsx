import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PlaceClusterer from './PlaceClusterer.jsx';
import PlaceMarker from './PlaceMarker.jsx';

const cluster = {
  getMarkers: () => [
    { getPosition: () => ({ lat: () => 23, lng: () => 87 }) },
    { getPosition: () => ({ lat: () => 23.01, lng: () => 87.01 }) },
  ],
  getCenter: () => ({ lat: 23, lng: 87 }),
};
vi.mock('@react-google-maps/api', () => ({
  MarkerClustererF: ({ children, onMouseOver, onMouseOut, onClick }) => (
    <>
      <button
        onMouseOver={() => onMouseOver(cluster)}
        onFocus={() => onMouseOver(cluster)}
        onMouseOut={onMouseOut}
        onBlur={onMouseOut}
        onClick={onClick}
      >
        Cluster
      </button>
      {children({})}
    </>
  ),
  MarkerF: ({ onMouseOver, onMouseOut, onClick }) => (
    <button
      onMouseOver={onMouseOver}
      onFocus={onMouseOver}
      onMouseOut={onMouseOut}
      onBlur={onMouseOut}
      onClick={onClick}
    >
      Place marker
    </button>
  ),
  OverlayViewF: ({ children }) => <div>{children}</div>,
}));
vi.mock('../../LiveTracking/mapPlaceIcon.js', () => ({ mapPlaceIcon: () => ({ url: 'icon' }) }));
const places = [
  { id: 'pump', name: 'Bhojpur pump', type: 'FUEL_PUMP', lat: 23, lng: 87 },
  { id: 'yard', name: 'Bhojpur yard', type: 'WAREHOUSE', lat: 23.01, lng: 87.01 },
  { id: 'elsewhere', name: 'Other town', type: 'PLANT', lat: 25, lng: 88 },
];

describe('place hover tooltips', () => {
  it('lists only the clustered places and hides the tooltip when leaving or clicking', () => {
    render(<PlaceClusterer places={places}>{() => null}</PlaceClusterer>);
    const marker = screen.getByRole('button', { name: 'Cluster' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.mouseOver(marker);
    expect(screen.getByRole('tooltip')).toHaveTextContent('2 places');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Bhojpur pump');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Bhojpur yard');
    expect(screen.getByRole('tooltip')).not.toHaveTextContent('Other town');
    fireEvent.mouseOut(marker);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.mouseOver(marker);
    fireEvent.click(marker);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows an individual place tooltip on hover and preserves click selection', () => {
    const onSelect = vi.fn();
    render(<PlaceMarker place={places[0]} interactive onSelect={onSelect} />);
    const marker = screen.getByRole('button', { name: 'Place marker' });
    fireEvent.mouseOver(marker);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Bhojpur pump');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Fuel pump');
    fireEvent.click(marker);
    expect(onSelect).toHaveBeenCalledWith('pump');
    fireEvent.mouseOut(marker);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
