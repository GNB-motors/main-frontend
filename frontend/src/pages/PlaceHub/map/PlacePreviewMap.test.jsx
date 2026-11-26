import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, act, waitFor } from '@testing-library/react';
import VectorGoogleMap from '../../LiveTracking/VectorGoogleMap.jsx';
import PlacePreviewMap from './PlacePreviewMap.jsx';
import PlaceMiniMap from '../intelligence/PlaceMiniMap.jsx';
import DuplicateMap from '../intelligence/DuplicateMap.jsx';
import PlaceIntelligenceService from '../intelligence/PlaceIntelligenceService.js';

const { map, loader, markers, disconnect } = vi.hoisted(() => ({
  map: { setCenter: vi.fn(), setZoom: vi.fn(), fitBounds: vi.fn() },
  loader: { isLoaded: true, loadError: null },
  markers: vi.fn(() => null),
  disconnect: vi.fn(),
}));
vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => loader,
  MarkerF: markers,
}));
vi.mock('../../LiveTracking/VectorGoogleMap.jsx', async () => {
  const { useEffect } = await import('react');
  return {
    default: vi.fn(function TestMap({ children, onLoad }) {
      useEffect(() => {
        onLoad(map);
      }, [onLoad]);
      return <div>{children}</div>;
    }),
  };
});
vi.mock('../intelligence/PlaceIntelligenceService.js', () => ({
  default: { getSite: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  loader.isLoaded = true;
  loader.loadError = null;
  vi.stubGlobal('google', {
    maps: {
      SymbolPath: { CIRCLE: 0 },
      Point: class {
        constructor(x, y) {
          this.x = x;
          this.y = y;
        }
      },
      event: { trigger: vi.fn() },
    },
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {
        disconnect();
      }
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

it('uses Live Tracking road tiles for a facility/home and switches imagery without refitting', () => {
  const view = render(<PlaceMiniMap lat={23} lng={87} label="Fleet yard" />);
  expect(VectorGoogleMap.mock.lastCall[0]).toMatchObject({
    osmBasemap: true,
    options: { mapTypeId: 'osm' },
  });
  expect(map.setCenter).toHaveBeenCalledWith({ lat: 23, lng: 87 });
  expect(markers.mock.lastCall[0]).toMatchObject({
    title: 'Fleet yard',
    position: { lat: 23, lng: 87 },
  });
  expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toBeInTheDocument();
  const fitCount = map.setCenter.mock.calls.length;
  fireEvent.click(screen.getByRole('button', { name: 'Satellite' }));
  expect(VectorGoogleMap.mock.lastCall[0].options.mapTypeId).toBe('hybrid');
  expect(map.setCenter).toHaveBeenCalledTimes(fitCount);
  expect(screen.queryByRole('link', { name: 'OpenStreetMap' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Map', exact: true }));
  expect(VectorGoogleMap.mock.lastCall[0].options.mapTypeId).toBe('osm');
  view.unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});

it('fits both duplicate sites and preserves their A/B labels', async () => {
  PlaceIntelligenceService.getSite.mockResolvedValue({
    site: { name: 'Other gate', centroidLat: 24, centroidLng: 88 },
  });
  render(
    <DuplicateMap
      a={{ _id: 'a', name: 'Gate', lat: 23, lng: 87 }}
      b={{ _id: 'b', name: 'Other gate' }}
    />,
  );
  await screen.findByRole('region', { name: 'Map of Gate and Other gate' });
  expect(PlaceIntelligenceService.getSite).toHaveBeenCalledWith('b', expect.anything());
  await waitFor(() =>
    expect(map.fitBounds).toHaveBeenCalledWith({ north: 24, south: 23, east: 88, west: 87 }, 40),
  );
  expect(markers.mock.calls.some(([props]) => props.label?.text === 'A: Gate')).toBe(true);
  expect(markers.mock.calls.some(([props]) => props.label?.text === 'B: Other gate')).toBe(true);
});

it('does not construct a map until the shared Google script has loaded', () => {
  loader.isLoaded = false;
  const points = [{ lat: 23, lng: 87 }];
  const view = render(<PlacePreviewMap points={points} label="Place" />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading map');
  expect(VectorGoogleMap).not.toHaveBeenCalled();
  loader.loadError = new Error('Network unavailable');
  view.rerender(<PlacePreviewMap points={points} label="Place" />);
  expect(screen.getByRole('alert')).toHaveTextContent('The map could not load');
});

it('keeps a missing location as an empty state rather than placing it at zero', () => {
  render(<PlaceMiniMap lat={null} lng={null} />);
  expect(screen.getByText('No location recorded for this place.')).toBeInTheDocument();
  expect(VectorGoogleMap).not.toHaveBeenCalled();
});

it('cancels the pending modal camera update when the preview unmounts', () => {
  vi.useFakeTimers();
  try {
    const view = render(<PlacePreviewMap points={[{ lat: 23, lng: 87 }]} label="Place" />);
    view.unmount();
    map.setCenter.mockClear();
    act(() => vi.advanceTimersByTime(200));
    expect(map.setCenter).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});
