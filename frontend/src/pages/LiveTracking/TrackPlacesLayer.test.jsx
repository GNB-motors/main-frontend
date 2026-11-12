import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MarkerClustererF } from '@react-google-maps/api';
import TrackPlacesLayer from './TrackPlacesLayer.jsx';
import { CLUSTER_STYLES_DARK, CLUSTER_STYLES_LIGHT } from '../PlaceHub/map/clusterer.js';

vi.mock('@react-google-maps/api', () => ({
  MarkerClustererF: vi.fn(({ children }) => children({})),
}));
vi.mock('../PlaceHub/map/PlaceShape.jsx', () => ({ default: () => null }));
vi.mock('../PlaceHub/map/PlaceMarker.jsx', () => ({
  default: ({ place }) => <span data-testid="pin">{place.name}</span>,
}));
vi.mock('../PlaceHub/map/PlaceAreaLabel.jsx', () => ({
  default: ({ name }) => <span data-testid="area-label">{name}</span>,
}));
vi.mock('../PlaceHub/map/ClusterRepaint.jsx', () => ({ default: () => null }));

describe('TrackPlacesLayer cluster options', () => {
  it('replaces the marker with a name inside a large area and restores it on zoom-out', () => {
    const places = [
      {
        id: 'yard',
        name: 'Fleet yard',
        polygon: [
          { lat: 23, lng: 87 },
          { lat: 23, lng: 87.005 },
          { lat: 23.005, lng: 87.005 },
          { lat: 23.005, lng: 87 },
        ],
      },
      { id: 'point', name: 'Small stop', lat: 23, lng: 87 },
    ];
    const view = render(<TrackPlacesLayer places={places} zoom={18} />);
    expect(screen.getByTestId('area-label')).toHaveTextContent('Fleet yard');
    expect(screen.getAllByTestId('pin')).toHaveLength(1);
    expect(screen.getByTestId('pin')).toHaveTextContent('Small stop');
    view.rerender(<TrackPlacesLayer places={places} zoom={9} />);
    expect(screen.queryByTestId('area-label')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('pin')).toHaveLength(2);
  });
  it.each([
    [false, CLUSTER_STYLES_LIGHT],
    [true, CLUSTER_STYLES_DARK],
  ])('provides the current styles when constructing the clusterer (dark: %s)', (dark, styles) => {
    render(<TrackPlacesLayer places={[{ id: 'p1' }]} zoom={8} dark={dark} />);
    expect(MarkerClustererF).toHaveBeenLastCalledWith(
      expect.objectContaining({ options: expect.objectContaining({ styles }) }),
      undefined,
    );
  });
});
