import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import MapPlacesLayer from './MapPlacesLayer.jsx';

const { map, clusters, markers, frames } = vi.hoisted(() => ({
  map: {},
  clusters: [],
  markers: [],
  frames: new Map(),
}));
vi.mock('@react-google-maps/api', () => ({ useGoogleMap: () => map }));
vi.mock('@googlemaps/markerclusterer', () => ({
  SuperClusterAlgorithm: class {},
  MarkerClusterer: class {
    constructor(options) {
      this.options = options;
      this.addMarker = vi.fn();
      this.removeMarker = vi.fn();
      this.render = vi.fn();
      this.clearMarkers = vi.fn();
      this.setMap = vi.fn();
      clusters.push(this);
    }
  },
}));
vi.mock('./mapPlaceIcon.js', () => ({
  mapPlaceIcon: vi.fn(() => ({ url: 'icon' })),
  layerForPlace: (p) => p.layer,
  colorForPlace: () => '#0ea5e9',
}));
import { mapPlaceIcon } from './mapPlaceIcon.js';
let nextFrame;
beforeEach(() => {
  markers.length = 0;
  clusters.length = 0;
  frames.clear();
  nextFrame = 0;
  vi.clearAllMocks();
  vi.stubGlobal('requestAnimationFrame', (fn) => {
    frames.set(++nextFrame, fn);
    return nextFrame;
  });
  vi.stubGlobal('cancelAnimationFrame', (id) => frames.delete(id));
  vi.stubGlobal('google', {
    maps: {
      Marker: class {
        constructor(options) {
          this.options = options;
          this.setMap = vi.fn();
          this.addListener = vi.fn(() => ({ remove: vi.fn() }));
          markers.push(this);
        }
      },
      Size: class {},
      Point: class {},
    },
  });
});
afterEach(() => vi.unstubAllGlobals());
const places = Array.from({ length: 201 }, (_, i) => ({
  id: String(i),
  name: `Pump ${i}`,
  layer: 'pumps',
  lat: 22 + i / 10000,
  lng: 88,
}));
function step() {
  act(() => {
    const [id, fn] = frames.entries().next().value;
    frames.delete(id);
    fn();
  });
}

describe('POI marker population', () => {
  it('reuses identical markers and publishes only additions/removals after batching', () => {
    const view = render(<MapPlacesLayer places={places.slice(0, 3)} />);
    step();
    const cluster = clusters[0];
    view.rerender(<MapPlacesLayer places={places.slice(0, 3).map((p) => ({ ...p }))} />);
    expect(frames.size).toBe(0);
    expect(markers).toHaveLength(3);
    expect(cluster.render).toHaveBeenCalledTimes(1);
    view.rerender(<MapPlacesLayer places={places.slice(1, 5)} />);
    expect(cluster.removeMarker).not.toHaveBeenCalled();
    expect(markers[0].setMap).not.toHaveBeenCalled();
    step();
    expect(markers).toHaveLength(5);
    expect(clusters).toHaveLength(1);
    expect(cluster.removeMarker).toHaveBeenCalledWith(markers[0], true);
    expect(cluster.render).toHaveBeenCalledTimes(2);
    expect(markers[1].setMap).not.toHaveBeenCalled();
    view.unmount();
  });
  it('batches detached markers, caches artwork, clusters once, and ignores unrelated renders', () => {
    const view = render(<MapPlacesLayer places={places} zoom={8} />);
    expect(markers).toHaveLength(0);
    step();
    expect(markers).toHaveLength(80);
    expect(clusters).toHaveLength(0);
    step();
    step();
    expect(markers).toHaveLength(201);
    expect(markers.every((m) => m.options.map === undefined)).toBe(true);
    expect(mapPlaceIcon).toHaveBeenCalledTimes(1);
    expect(clusters).toHaveLength(1);
    view.rerender(<MapPlacesLayer places={places} zoom={9} />);
    expect(markers).toHaveLength(201);
    view.unmount();
    expect(clusters[0].setMap).toHaveBeenCalledWith(null);
    expect(markers.every((m) => m.setMap.mock.calls.at(-1)?.[0] === null)).toBe(true);
  });
  it('cancels incomplete population when the layer is switched off', () => {
    const view = render(<MapPlacesLayer places={places} />);
    step();
    view.rerender(<MapPlacesLayer places={[]} />);
    expect(frames.size).toBe(0);
    expect(markers).toHaveLength(80);
    expect(clusters).toHaveLength(0);
    expect(markers.every((m) => m.setMap.mock.calls.at(-1)?.[0] === null)).toBe(true);
    view.unmount();
  });
});
