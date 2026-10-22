import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render as renderComponent, cleanup, act } from '@testing-library/react';

const state = vi.hoisted(() => ({ map: {}, clusters: [], markers: [], algorithms: [] }));
vi.mock('@react-google-maps/api', () => ({
  useGoogleMap: () => state.map,
  GoogleMapsMarkerClusterer: {
    MarkerClusterer: class {
      constructor(options) {
        this.options = options;
        this.members = new Set();
        state.clusters.push(this);
      }
      addMarkers(items) {
        items.forEach((item) => this.members.add(item));
      }
      removeMarkers(items) {
        items.forEach((item) => this.members.delete(item));
      }
      clearMarkers = vi.fn();
      setMap = vi.fn();
      render = vi.fn();
    },
    SuperClusterAlgorithm: class {
      constructor(options) {
        this.options = options;
        state.algorithms.push(this);
      }
      calculate() {
        return { clusters: [], changed: false };
      }
    },
  },
}));
vi.mock('./vehicleMarkerIcon.js', () => ({ createVehicleMarkerIcon: () => ({}) }));
import AnimatedVehicleMarkers from './AnimatedVehicleMarkers.jsx';
import { createLiveClusterAlgorithm, createClusterRenderer } from './vehicleClustering.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  state.clusters = [];
  state.markers = [];
  state.algorithms = [];
});
function setupGoogle() {
  window.google = {
    maps: {
      Marker: class {
        constructor(options) {
          this.options = options;
          this.point = options.position;
          state.markers.push(this);
        }
        addListener = vi.fn();
        setMap = vi.fn();
        setIcon = vi.fn();
        setZIndex = vi.fn();
        getPosition() {
          return { lat: () => this.point.lat, lng: () => this.point.lng };
        }
        setPosition(point) {
          this.point = point;
        }
      },
      event: { clearInstanceListeners: vi.fn() },
      SymbolPath: { CIRCLE: 0 },
    },
  };
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
}
const vehicles = [
  { id: 'a', plate: 'A', hasFix: true, lat: 25, lng: 84 },
  { id: 'b', plate: 'B', hasFix: true, lat: 25.001, lng: 84.001 },
];

describe('live marker clustering', () => {
  it('excludes the selected truck, updates membership on filters, and cleans up', () => {
    setupGoogle();
    const select = vi.fn();
    const view = renderComponent(<AnimatedVehicleMarkers vehicles={vehicles} onSelect={select} />);
    const clusterer = state.clusters[0];
    expect(clusterer.members.size).toBe(2);
    const [a, b] = state.markers;
    act(() => a.addListener.mock.calls[0][1]());
    expect(select).toHaveBeenCalledWith('a');
    view.rerender(<AnimatedVehicleMarkers vehicles={vehicles} selectedId="a" onSelect={select} />);
    expect([...clusterer.members]).toEqual([b]);
    expect(a.setMap).toHaveBeenLastCalledWith(state.map);
    view.rerender(<AnimatedVehicleMarkers vehicles={[vehicles[0]]} onSelect={select} />);
    expect([...clusterer.members]).toEqual([a]);
    expect(b.setMap).toHaveBeenLastCalledWith(null);
    view.unmount();
    expect(clusterer.clearMarkers).toHaveBeenCalled();
    expect(clusterer.setMap).toHaveBeenCalledWith(null);
    expect(a.setMap).toHaveBeenLastCalledWith(null);
  });
  it('invalidates the spatial index when the same marker moves, not on every render', () => {
    setupGoogle();
    const marker = new window.google.maps.Marker({ position: { lat: 25, lng: 84 } });
    const algorithm = createLiveClusterAlgorithm();
    const input = { markers: [marker] };
    expect(algorithm.calculate(input).changed).toBe(true);
    expect(algorithm.calculate(input).changed).toBe(false);
    expect(state.algorithms).toHaveLength(1);
    marker.setPosition({ lat: 26, lng: 85 });
    expect(algorithm.calculate(input).changed).toBe(true);
    expect(state.algorithms).toHaveLength(2);
    expect(state.algorithms[1].options).toEqual({ radius: 65, maxZoom: 15 });
  });
  it('renders a count badge with a descriptive title', () => {
    setupGoogle();
    const marker = createClusterRenderer().render({ count: 24, position: { lat: 25, lng: 84 } });
    expect(marker.options.label.text).toBe('24');
    expect(marker.options.title).toContain('24 vehicles');
  });
});
