import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PolylineF } from '@react-google-maps/api';
import LiveMapCanvas from './LiveMapCanvas.jsx';
import focusedMapVehicles from './focusedMapVehicles.js';

const { map, overlays } = vi.hoisted(() => ({ map: {}, overlays: [] }));
vi.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }) => <div>{children}</div>,
  PolylineF: vi.fn(() => null),
  MarkerF: () => null,
  useGoogleMap: () => map,
}));
vi.mock('./AnimatedVehicleMarkers.jsx', () => ({ default: () => null }));
vi.mock('../../components/map/CongestionLayer', () => ({ default: () => null }));

let pane;
beforeEach(() => {
  vi.clearAllMocks();
  overlays.length = 0;
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
  it('draws the dotted grey route and the growing blue travelled line', () => {
    render(<LiveMapCanvas {...props} />);
    const lines = PolylineF.mock.calls.map(([p]) => p);
    const background = lines.find((p) => p.options.strokeOpacity === 0);
    expect(background?.options.icons[0]).toMatchObject({
      repeat: '10px',
      icon: { fillColor: '#9A9AA5' },
    });
    expect(lines.find((p) => p.options.strokeColor === '#2F58EE')).toMatchObject({
      path: props.replayRunPaths[0].path,
      options: { strokeWeight: 5, strokeOpacity: 0.95 },
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

describe('Fleet markers while focused on one truck', () => {
  const fleet = [{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }];
  it('shows the whole fleet when nothing is selected', () => {
    expect(focusedMapVehicles(fleet, { selectedId: null, replayOn: false })).toEqual(fleet);
  });
  it('shows only the selected truck when one is selected', () => {
    expect(focusedMapVehicles(fleet, { selectedId: 'v2', replayOn: false })).toEqual([
      { id: 'v2' },
    ]);
  });
  it('hides every live marker during Replay (the replay truck stands in)', () => {
    expect(focusedMapVehicles(fleet, { selectedId: 'v2', replayOn: true })).toEqual([]);
  });
});
