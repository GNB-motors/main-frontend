import { act, render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleMap, PolygonF } from '@react-google-maps/api';
import PlaceHubMap from './PlaceHubMap.jsx';

const { map } = vi.hoisted(() => ({
  map: {
    getZoom: vi.fn(() => 18),
    setMapTypeId: vi.fn(),
    addListener: vi.fn(() => ({ remove: vi.fn() })),
  },
}));
vi.mock('@react-google-maps/api', async () => {
  const { useEffect } = await import('react');
  return {
    GoogleMap: vi.fn(function TestMap({ children, onLoad }) {
      useEffect(() => {
        onLoad(map);
      }, [onLoad]);
      return <div>{children}</div>;
    }),
    MarkerClustererF: ({ children }) => children({}),
    PolygonF: vi.fn(({ onClick }) => <button onClick={onClick}>Area</button>),
    CircleF: () => null,
    MarkerF: () => null,
    PolylineF: () => null,
    InfoWindowF: () => null,
    OverlayViewF: ({ children }) => <div data-testid="area-label">{children}</div>,
    OverlayView: { OVERLAY_MOUSE_TARGET: 'overlayMouseTarget' },
  };
});
vi.mock('./map/usePoiLayer.js', () => ({ default: () => ({ pois: [], load: () => {} }) }));
vi.mock('./map/useTollLayer.js', () => ({ default: () => ({ plazas: [], load: () => {} }) }));
vi.mock('./map/PlaceMarker.jsx', () => ({
  default: ({ place }) => <span data-testid="pin">{place.name}</span>,
}));
vi.mock('./map/ClusterRepaint.jsx', () => ({ default: () => null }));
vi.mock('./map/DraftLayer.jsx', () => ({ default: () => null }));

const places = [
  {
    id: 'yard',
    name: 'Fleet yard',
    type: 'YARD',
    polygon: [
      { lat: 23, lng: 87 },
      { lat: 23, lng: 87.005 },
      { lat: 23.005, lng: 87.005 },
      { lat: 23.005, lng: 87 },
    ],
  },
  { id: 'point', name: 'Small stop', lat: 23, lng: 87 },
];
const base = {
  isLoaded: true,
  tab: 'places',
  places,
  contextPlaces: [],
  idleLive: [],
  idleSpots: [],
  hotspots: [],
  drainCells: [],
  fitPoints: [],
};
const zoomTo = (zoom) =>
  act(() => {
    map.getZoom.mockReturnValue(zoom);
    GoogleMap.mock.calls.at(-1)[0].onZoomChanged();
  });

beforeEach(() => vi.clearAllMocks());

describe('Place Hub area labels', () => {
  it('replaces a pin at close zoom, keeps the area clickable, and restores pins on zoom-out', () => {
    const onSelect = vi.fn();
    render(<PlaceHubMap {...base} onSelect={onSelect} />);
    expect(screen.getAllByTestId('pin')).toHaveLength(2);
    zoomTo(18);
    expect(screen.getByTestId('area-label')).toHaveTextContent('Fleet yard');
    expect(screen.getAllByTestId('pin')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Area' }));
    expect(onSelect).toHaveBeenCalledWith('yard');
    zoomTo(9);
    expect(screen.queryByTestId('area-label')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('pin')).toHaveLength(2);
  });

  it('hides edited places and keeps shape interaction disabled while drafting', () => {
    const view = render(<PlaceHubMap {...base} hiddenPlaceId="yard" onSelect={() => {}} />);
    zoomTo(18);
    expect(screen.queryByTestId('area-label')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('pin')).toHaveLength(1);
    view.rerender(<PlaceHubMap {...base} draft={{ shape: 'circle' }} onSelect={() => {}} />);
    expect(PolygonF.mock.calls.at(-1)[0].options.clickable).toBe(false);
  });
});
