import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PolylineF } from '@react-google-maps/api';
import RouteLayer from '../PlaceHub/map/RouteLayer.jsx';
import LiveMapCanvas from './LiveMapCanvas.jsx';
import focusedMapVehicles from './focusedMapVehicles.js';

const { map, overlays } = vi.hoisted(() => ({ map: {}, overlays: [] }));
vi.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }) => <div>{children}</div>,
  PolylineF: vi.fn(() => null),
  MarkerF: () => null,
  useGoogleMap: () => map,
}));
vi.mock('../PlaceHub/map/RouteLayer.jsx', () => ({ default: vi.fn(() => null) }));
vi.mock('./AnimatedVehicleMarkers.jsx', () => ({ default: () => null }));
vi.mock('../../components/map/CongestionLayer', () => ({ default: () => null }));

let pane;
beforeEach(() => {
  vi.clearAllMocks();
  overlays.length = 0;
  map.fitBounds = vi.fn();
  map.getBounds = vi.fn(() => null);
  map.panTo = vi.fn();
  pane = document.createElement('div');
  document.body.appendChild(pane);
  class OverlayView {
    constructor() {
      overlays.push(this);
      this.setMap = vi.fn((value) => {
        if (value) {
          this.onAdd();
          this.draw();
        } else this.onRemove();
      });
    }
    getPanes() {
      return { overlayMouseTarget: pane };
    }
    getProjection() {
      return { fromLatLngToDivPixel: (p) => ({ x: p.lng * 10, y: p.lat * 10 }) };
    }
  }
  vi.stubGlobal('google', {
    maps: {
      OverlayView,
      SymbolPath: { CIRCLE: 0 },
      LatLng: class {
        constructor(point) {
          Object.assign(this, point);
        }
      },
      LatLngBounds: class {
        constructor() {
          this.points = [];
        }
        extend(point) {
          this.points.push(point);
        }
      },
      Size: class {},
      Point: class {},
    },
  });
});
afterEach(() => {
  pane.remove();
  vi.unstubAllGlobals();
});

const props = {
  isLoaded: true,
  mapZoom: 12,
  mapRef: { current: map },
  mapOptions: {},
  mapVehicles: [],
  selectedId: 'v1',
  isTrailVisible: true,
  selectedStatusColor: '#187A32',
  trailCoords: [
    { lat: 22, lng: 88 },
    { lat: 23, lng: 89 },
  ],
  replayState: { on: true },
  replayPtsCoords: [
    { lat: 22, lng: 88 },
    { lat: 23, lng: 89 },
  ],
  replayBaseLayers: [],
  replayRoadLayers: [],
  replayRunPaths: [
    {
      key: 'start',
      path: [
        { lat: 22, lng: 88 },
        { lat: 22.5, lng: 88.5 },
      ],
    },
  ],
  replayCurrentPos: { lat: 22.5, lng: 88.5 },
  replaySpeed: 40,
  habitualHalts: [],
};

describe('Track replay presentation', () => {
  it('keeps raw replay geometry dotted, including the travelled part', () => {
    render(<LiveMapCanvas {...props} />);
    const lines = PolylineF.mock.calls.map(([p]) => p);
    const background = lines.find((p) => p.options.strokeOpacity === 0);
    expect(background?.options.icons[0]).toMatchObject({
      repeat: '10px',
      icon: { fillColor: '#9A9AA5' },
    });
    expect(lines.find((p) => p.path === props.replayRunPaths[0].path)).toMatchObject({
      path: props.replayRunPaths[0].path,
      options: { strokeOpacity: 0, icons: [{ repeat: '10px' }] },
    });
  });
  it('keeps the same truck DOM and map overlay as playback and zoom change', () => {
    const { rerender, unmount } = render(<LiveMapCanvas {...props} />);
    const truck = pane.querySelector('.rh-truck');
    expect(truck).not.toBeNull();
    const svg = truck.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('19');
    rerender(
      <LiveMapCanvas
        {...props}
        mapZoom={16}
        replayCurrentPos={{ lat: 22.6, lng: 88.6 }}
        replaySpeed={80}
      />,
    );
    expect(pane.querySelector('.rh-truck')).toBe(truck);
    expect(truck.querySelector('svg')).toBe(svg);
    expect(truck.classList.contains('fast')).toBe(true);
    expect(overlays).toHaveLength(1);
    expect(overlays[0].setMap).toHaveBeenCalledTimes(1);
    expect(PolylineF.mock.calls.filter(([p]) => p.path === props.replayPtsCoords)).toHaveLength(1);
    unmount();
    expect(overlays[0].setMap).toHaveBeenLastCalledWith(null);
  });
});

const track = {
  points: [
    { t: '2026-11-01T13:00:00Z', lat: 22, lng: 88, speedKmh: 40 },
    { t: '2026-11-01T13:10:00Z', lat: 23, lng: 89, speedKmh: 70 },
  ],
};

describe('Track mode', () => {
  it('draws the truck being replayed, on an overlay above the line', () => {
    render(<LiveMapCanvas {...props} track={track} trackPlayheadTime="2026-11-01T13:10:00Z" />);
    const truck = pane.querySelector('.rh-truck');
    expect(truck).not.toBeNull();
    // The truck turns with the heading it actually had.
    expect(truck.querySelector('div').style.transform).toMatch(/rotate\(/);
  });

  it('fits the whole trail once, so the owner sees the whole drive', () => {
    const { rerender } = render(
      <LiveMapCanvas {...props} track={track} trackPlayheadTime="2026-11-01T13:10:00Z" />,
    );
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    const [bounds, padding] = map.fitBounds.mock.calls[0];
    expect(bounds.points).toEqual([
      { lat: 22, lng: 88 },
      { lat: 23, lng: 89 },
    ]);
    expect(padding).toEqual({ top: 80, right: 60, bottom: 120, left: 60 });
    rerender(<LiveMapCanvas {...props} track={track} trackPlayheadTime="2026-11-01T13:05:00Z" />);
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
  });
});

describe('Fleet markers while focused on one truck', () => {
  const fleet = [{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }];
  it('shows the whole fleet when nothing is selected', () => {
    expect(focusedMapVehicles(fleet, { selectedId: null, replayOn: false })).toEqual(fleet);
  });
  it('shows only the selected truck', () => {
    expect(focusedMapVehicles(fleet, { selectedId: 'v2', replayOn: false })).toEqual([fleet[1]]);
  });
  it('hides every live marker during Replay (the replay truck stands in)', () => {
    expect(focusedMapVehicles(fleet, { selectedId: 'v2', replayOn: true })).toEqual([]);
  });
});

it('shows primary delivery roads at overview zoom while retaining the movement zoom floor', () => {
  const config = { ...props, replayState: { on: false }, isTrailVisible: false, selectedId: null, mapZoom: 5, routeKind: 'delivery', routeLines: [{ id: 'delivery1', segments: [] }] };
  const view = render(<LiveMapCanvas {...config} />);
  expect(RouteLayer).toHaveBeenCalled();
  RouteLayer.mockClear();
  view.rerender(<LiveMapCanvas {...config} routeKind="movement" />);
  expect(RouteLayer).not.toHaveBeenCalled();
});
