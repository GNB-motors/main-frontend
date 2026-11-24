import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useGoogleMap } from '@react-google-maps/api';
import LiveMapCanvas from './LiveMapCanvas.jsx';
import TrafficLayer from './TrafficLayer.jsx';
import ReplayTruckMarker from './ReplayTruckMarker.jsx';
import { LIGHT_MAP_STYLE } from './mapStyles';

vi.mock('@react-google-maps/api', async (original) => ({
  ...(await original()),
  MarkerF: () => null,
  PolylineF: () => null,
}));
vi.mock('./AnimatedVehicleMarkers.jsx', () => ({ default: () => null }));
vi.mock('./TrackMapLayers.jsx', () => ({ default: () => null }));
vi.mock('./TrafficLayer.jsx', () => ({ default: vi.fn(() => null) }));
vi.mock('./ReplayTruckMarker.jsx', () => ({
  default: vi.fn(() => null),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('enters replay, toggles 3D and returns to the grey map without mutating a renderer', () => {
  const maps = [];
  const constructor = vi.fn(function (_container, options) {
    const camera = { ...options };
    const listeners = new Map();
    const map = {
      mapTypes: { set: vi.fn() },
      getRenderingType: () => options.renderingType,
      setRenderingType: vi.fn(() => {
        throw new Error("Setting map 'renderingType' after instantiation is not supported.");
      }),
      setOptions: vi.fn((next) => {
        if ('renderingType' in next) throw new Error('Immutable renderingType');
      }),
      getCenter: () => ({ lat: () => camera.center.lat, lng: () => camera.center.lng }),
      getZoom: () => camera.zoom,
      getHeading: () => camera.heading,
      getTilt: () => camera.tilt,
      getBounds: () => null,
      fitBounds: vi.fn(),
      moveCamera: vi.fn((next) => {
        Object.assign(camera, next);
        listeners.get('heading_changed')?.forEach((handler) => handler());
      }),
      addListener: vi.fn((name, handler) => {
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name).add(handler);
        return { remove: () => listeners.get(name).delete(handler) };
      }),
    };
    maps.push(map);
    return map;
  });
  vi.stubGlobal('google', {
    maps: {
      Map: constructor,
      ImageMapType: class {
        constructor(options) {
          this.options = options;
        }
      },
      Size: class {},
      LatLngBounds: class {
        extend() {}
      },
      SymbolPath: { CIRCLE: 0 },
    },
  });
  ReplayTruckMarker.mockImplementation(function ReplayProbe() {
    const map = useGoogleMap();
    return <output>{`Truck on map ${maps.indexOf(map) + 1}`}</output>;
  });
  const mapRef = { current: null };
  const onUnavailable = vi.fn();
  const onLoad = vi.fn((map) => {
    mapRef.current = map;
  });
  const track = {
    points: [
      { t: '2026-11-01T13:00:00Z', lat: 22, lng: 88, speedKmh: 40 },
      { t: '2026-11-01T13:10:00Z', lat: 23, lng: 89, speedKmh: 40 },
    ],
  };
  const props = {
    isLoaded: true,
    mapZoom: 12,
    mapRef,
    mapOptions: { styles: LIGHT_MAP_STYLE },
    onMapLoad: onLoad,
    mapVehicles: [],
    trailCoords: [],
    replayState: { on: false },
    onFollowUnavailable: onUnavailable,
  };
  const { rerender, getByText, unmount } = render(<LiveMapCanvas {...props} />);
  expect(constructor).toHaveBeenCalledOnce();
  rerender(<LiveMapCanvas {...props} track={track} trackPlayheadTime="2026-11-01T13:00:00Z" />);
  expect(getByText('Truck on map 1')).toBeInTheDocument();
  expect(constructor).toHaveBeenCalledOnce();
  rerender(
    <LiveMapCanvas
      {...props}
      track={track}
      trackPlayheadTime="2026-11-01T13:00:00Z"
      followCameraEnabled
    />,
  );
  expect(getByText('Truck on map 2')).toBeInTheDocument();
  expect(maps[1].moveCamera).toHaveBeenCalledWith(
    expect.objectContaining({
      center: { lat: 22, lng: 88 },
      tilt: 60,
      zoom: 16,
    }),
  );
  expect(onUnavailable).not.toHaveBeenCalled();
  rerender(
    <LiveMapCanvas
      {...props}
      track={track}
      trackPlayheadTime="2026-11-01T13:10:00Z"
      followCameraEnabled
    />,
  );
  expect(constructor).toHaveBeenCalledTimes(2);
  expect(maps[1].moveCamera).toHaveBeenLastCalledWith(
    expect.objectContaining({ center: { lat: 23, lng: 89 } }),
  );
  rerender(<LiveMapCanvas {...props} track={track} trackPlayheadTime="2026-11-01T13:10:00Z" />);
  expect(getByText('Truck on map 3')).toBeInTheDocument();
  expect(constructor.mock.calls[2][1]).toMatchObject({
    renderingType: 'RASTER',
    tilt: 0,
    heading: 0,
    center: constructor.mock.calls[0][1].center,
    zoom: constructor.mock.calls[0][1].zoom,
  });
  expect(constructor.mock.calls[2][1].styles).toEqual(expect.arrayContaining(LIGHT_MAP_STYLE));
  expect(mapRef.current).toBe(maps[2]);
  expect(TrafficLayer.mock.lastCall[0].map).toBe(maps[2]);
  expect(maps.every((map) => map.setRenderingType.mock.calls.length === 0)).toBe(true);
  unmount();
  expect(mapRef.current).toBeNull();
});
