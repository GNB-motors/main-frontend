import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import RouteLayer from './RouteLayer.jsx';

let polylines;
let markers;
let listeners;
const segment = [
  { lat: 23, lng: 86 },
  { lat: 24, lng: 87 },
];
const leg = {
  _id: 'a',
  fromSiteId: 's1',
  toSiteId: 's2',
  traversals: 5,
  title: 'Plant → Town',
  inPlant: false,
  path: { source: 'DRIVEN' },
  segments: [segment],
};
const lines = [{ id: 'a', legs: [leg], segments: [segment], source: 'DRIVEN', runs: 5 }];
const sites = new Map([
  ['s1', { name: 'Plant', lat: 23, lng: 86 }],
  ['s2', { name: 'Town', lat: 24, lng: 87 }],
]);
const props = {
  map: { getDiv: () => ({ getBoundingClientRect: () => ({ left: 0, top: 0, width: 800 }) }) },
  lines,
  sites,
  selectedId: null,
  hoveredId: null,
  onPick: vi.fn(),
  onHover: vi.fn(),
  onSite: vi.fn(),
  isDark: false,
  zoom: 8,
};
beforeEach(() => {
  polylines = [];
  markers = [];
  listeners = [];
  class MapObject {
    constructor(options) {
      this.options = options;
      this.setMap = vi.fn();
      this.setOptions = vi.fn();
    }
    addListener(name, callback) {
      const event = { name, callback, remove: vi.fn() };
      listeners.push(event);
      return event;
    }
  }
  window.google = {
    maps: {
      Polyline: class extends MapObject {
        constructor(options) {
          super(options);
          polylines.push(this);
        }
      },
      Marker: class extends MapObject {
        constructor(options) {
          super(options);
          markers.push(this);
        }
      },
      Point: class {
        constructor(x, y) {
          this.x = x;
          this.y = y;
        }
      },
      SymbolPath: { CIRCLE: 'circle', FORWARD_CLOSED_ARROW: 'arrow' },
    },
  };
  vi.clearAllMocks();
});
afterEach(() => {
  delete window.google;
});

it('updates hover without recreating polylines and detaches every object and listener', () => {
  const view = render(<RouteLayer {...props} />);
  expect(polylines).toHaveLength(3);
  expect(polylines[2].options.strokeWeight).toBe(14);
  expect(polylines[1].options.clickable).toBe(false);
  view.rerender(<RouteLayer {...props} hoveredId="a" />);
  expect(polylines).toHaveLength(3);
  expect(polylines[1].setOptions).toHaveBeenLastCalledWith(
    expect.objectContaining({ strokeOpacity: 1 }),
  );
  act(() => listeners.find((l) => l.name === 'click').callback());
  expect(props.onPick).toHaveBeenCalledWith('a');
  view.unmount();
  for (const object of [...polylines, ...markers]) expect(object.setMap).toHaveBeenCalledWith(null);
  for (const listener of listeners) expect(listener.remove).toHaveBeenCalled();
});

it('uses the chosen reverse direction for arrows and A/B pins', () => {
  const reverse = { ...leg, _id: 'b', segments: [[...segment].reverse()] };
  const view = render(
    <RouteLayer {...props} lines={[{ ...lines[0], legs: [leg, reverse] }]} selectedId="b" />,
  );
  expect(polylines[3].options.path).toEqual([...segment].reverse());
  const pins = markers.filter((m) => ['A', 'B'].includes(m.options.label));
  expect(pins[0].options.position).toEqual(segment[1]);
  expect(pins[1].options.position).toEqual(segment[0]);
  view.unmount();
});

it('draws an in-plant count at its places without a road line', () => {
  const view = render(
    <RouteLayer {...props} lines={[{ ...lines[0], legs: [{ ...leg, inPlant: true }] }]} />,
  );
  expect(polylines).toHaveLength(0);
  expect(markers).toHaveLength(2);
  expect(markers[0].options.label.text).toBe('1');
  view.unmount();
});
