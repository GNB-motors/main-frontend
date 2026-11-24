import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MarkerF, PolylineF } from '@react-google-maps/api';
import RouteLayer from '../PlaceHub/map/RouteLayer.jsx';
import LiveMapCanvas from './LiveMapCanvas.jsx';
import focusedMapVehicles from './focusedMapVehicles.js';
import AnimatedVehicleMarkers from './AnimatedVehicleMarkers.jsx';
import VectorGoogleMap from './VectorGoogleMap.jsx';
import { LIGHT_MAP_STYLE } from './mapStyles.js';

const { map, overlays } = vi.hoisted(() => ({ map: {}, overlays: [] }));
vi.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }) => <div>{children}</div>,
  PolylineF: vi.fn(() => null),
  MarkerF: vi.fn(() => null),
  OverlayViewF: ({ children }) => <div>{children}</div>,
  useGoogleMap: () => map,
}));
vi.mock('../PlaceHub/map/RouteLayer.jsx', () => ({ default: vi.fn(() => null) }));
vi.mock('./AnimatedVehicleMarkers.jsx', () => ({ default: vi.fn(() => null) }));
vi.mock('./VectorGoogleMap.jsx', () => ({
  default: vi.fn(({ children }) => <div>{children}</div>),
}));
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

it('uses the original grey map normally and reserves vector zoom for the 3D toggle', () => {
  const mapOptions = { styles: LIGHT_MAP_STYLE };
  const view = render(<LiveMapCanvas {...props} mapOptions={mapOptions} />);
  expect(VectorGoogleMap.mock.lastCall[0]).toMatchObject({
    renderingType: 'RASTER',
    zoom: 12,
    options: { styles: LIGHT_MAP_STYLE, isFractionalZoomEnabled: false },
  });
  view.rerender(
    <LiveMapCanvas {...props} mapOptions={mapOptions} mapZoom={15} followCameraEnabled />,
  );
  expect(VectorGoogleMap.mock.lastCall[0]).toMatchObject({
    renderingType: 'VECTOR',
    zoom: 12,
    options: { isFractionalZoomEnabled: true },
  });
  view.rerender(<LiveMapCanvas {...props} mapOptions={mapOptions} mapZoom={16} />);
  expect(VectorGoogleMap.mock.lastCall[0]).toMatchObject({
    renderingType: 'RASTER',
    zoom: 12,
    options: { styles: LIGHT_MAP_STYLE, isFractionalZoomEnabled: false },
  });
});

describe('habitual stop hover tooltips', () => {
  const haltProps = {
    ...props,
    replayState: { on: false },
    isTrailVisible: false,
    isHabitualHaltsVisible: true,
    habitualHalts: [
      { lat: 22, lng: 88, occurrences: 3, medianDwellMs: 7200000 },
      { lat: 23, lng: 89, occurrences: 7, medianDwellMs: 1800000 },
    ],
  };
  const haltMarkers = () => MarkerF.mock.calls.map(([p]) => p).filter((p) => p.onMouseOver);

  it('shows stop details on hover, keeps other markers visible and dismisses on mouse out', () => {
    render(<LiveMapCanvas {...haltProps} />);
    const [first, second] = haltMarkers();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(first.onClick).toBeUndefined();
    MarkerF.mockClear();
    act(() => first.onMouseOver());
    expect(screen.getByRole('tooltip')).toHaveTextContent('Habitual stop');
    expect(screen.getByRole('tooltip')).toHaveTextContent('3× stopped here');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Usually ~2 h');
    expect(haltMarkers()).toHaveLength(2);
    act(() => second.onMouseOver());
    act(() => first.onMouseOut());
    expect(screen.getByRole('tooltip')).toHaveTextContent('7× stopped here');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Usually ~30 min');
    act(() => second.onMouseOut());
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('clears the tooltip when the layer is hidden or the selected truck changes', () => {
    const { rerender } = render(<LiveMapCanvas {...haltProps} />);
    act(() => haltMarkers()[0].onMouseOver());
    rerender(<LiveMapCanvas {...haltProps} isHabitualHaltsVisible={false} />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    rerender(<LiveMapCanvas {...haltProps} />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    act(() => haltMarkers().at(-1).onMouseOver());
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    rerender(<LiveMapCanvas {...haltProps} selectedId="other-truck" />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

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
    const truck = pane.querySelector('.replay-truck-marker');
    expect(truck).not.toBeNull();
    const svg = truck.querySelector('svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 96 96');
    expect(svg.innerHTML).toContain('M53.1321 14.2725'); // Trip Details truck's forward beam
    rerender(
      <LiveMapCanvas
        {...props}
        mapZoom={16}
        replayCurrentPos={{ lat: 22.6, lng: 88.6 }}
        replaySpeed={80}
      />,
    );
    expect(pane.querySelector('.replay-truck-marker')).toBe(truck);
    expect(truck.querySelector('svg')).not.toBe(svg);
    expect(truck.querySelector('.replay-truck-vehicle').innerHTML).toContain('#EF4444');
    const fastSvg = truck.querySelector('svg');
    rerender(
      <LiveMapCanvas
        {...props}
        mapZoom={17}
        replayCurrentPos={{ lat: 22.7, lng: 88.7 }}
        replaySpeed={81}
      />,
    );
    expect(truck.querySelector('svg')).toBe(fastSvg);
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
  it('keeps roads and road names visible behind a tracked journey', () => {
    render(<LiveMapCanvas {...props} track={track} mapOptions={{ styles: LIGHT_MAP_STYLE }} />);
    const styles = VectorGoogleMap.mock.lastCall[0].options.styles;
    expect(
      styles.some(
        (rule) =>
          rule.featureType === 'road' &&
          rule.stylers?.some((styler) => styler.visibility === 'off'),
      ),
    ).toBe(false);
    expect(styles).toContainEqual({
      featureType: 'road',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }],
    });
  });
  it('follows the replay truck in 3D without fitting or edge-panning the whole route', () => {
    map.getZoom = () => 12;
    map.getRenderingType = () => 'VECTOR';
    map.moveCamera = vi.fn();
    const view = render(
      <LiveMapCanvas
        {...props}
        track={track}
        trackPlayheadTime="2026-11-01T13:10:00Z"
        followCameraEnabled
      />,
    );
    expect(map.moveCamera).toHaveBeenCalledWith(
      expect.objectContaining({
        center: { lat: 23, lng: 89 },
        tilt: 60,
        zoom: 16,
      }),
    );
    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(map.panTo).not.toHaveBeenCalled();
    view.unmount();
    delete map.getZoom;
    delete map.getRenderingType;
    delete map.moveCamera;
  });
  it('draws the truck being replayed, on an overlay above the line', () => {
    render(<LiveMapCanvas {...props} track={track} trackPlayheadTime="2026-11-01T13:10:00Z" />);
    const truck = pane.querySelector('.replay-truck-marker');
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
  it('shows the filtered fleet if the selected truck is no longer in scope', () => {
    expect(focusedMapVehicles(fleet, { selectedId: 'filtered-out', replayOn: false })).toEqual(
      fleet,
    );
  });
  it('hides every live marker during Replay (the replay truck stands in)', () => {
    expect(focusedMapVehicles(fleet, { selectedId: 'v2', replayOn: true })).toEqual([]);
  });
});

it('shows delivery and movement roads at overview zoom', () => {
  const config = {
    ...props,
    replayState: { on: false },
    isTrailVisible: false,
    selectedId: null,
    mapZoom: 5,
    routeKind: 'delivery',
    routeLines: [{ id: 'delivery1', segments: [] }],
  };
  const view = render(<LiveMapCanvas {...config} />);
  expect(RouteLayer).toHaveBeenCalled();
  RouteLayer.mockClear();
  view.rerender(<LiveMapCanvas {...config} routeKind="movement" />);
  expect(RouteLayer).toHaveBeenCalled();
});

describe('selected vehicle Places context', () => {
  it('keeps the live marker alongside its recorded journey outside replay', () => {
    const vehicle = { id: 'live-TEST01', plate: 'TEST01', lat: 22, lng: 88 };
    render(
      <LiveMapCanvas
        {...props}
        track={track}
        trackReplay={false}
        trackReg="TEST01"
        replayState={{ on: false }}
        selectedId={vehicle.id}
        mapVehicles={[vehicle]}
      />,
    );
    expect(AnimatedVehicleMarkers.mock.calls.at(-1)[0].vehicles).toEqual([vehicle]);
  });
  it('refits when another vehicle has fixes at the same timestamps', () => {
    const { rerender } = render(<LiveMapCanvas {...props} track={track} trackReg="FIRST" />);
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    rerender(<LiveMapCanvas {...props} track={track} trackReg="SECOND" />);
    expect(map.fitBounds).toHaveBeenCalledTimes(2);
  });
});
