import { afterEach, expect, it, vi } from 'vitest';
import { createLiveClusterAlgorithm } from './vehicleClustering.js';

afterEach(() => vi.unstubAllGlobals());

it('clusters nearby vehicles, splits on zoom, and reclusters live movement', () => {
  class LatLng {
    constructor(lat, lng) {
      this.point = typeof lat === 'object' ? lat : { lat, lng };
    }
    lat() {
      return this.point.lat;
    }
    lng() {
      return this.point.lng;
    }
  }
  vi.stubGlobal('google', { maps: { LatLng } });
  const marker = (lat, lng) => ({
    point: new LatLng(lat, lng),
    getPosition() {
      return this.point;
    },
    getVisible: () => true,
  });
  const a = marker(25, 84);
  const b = marker(25.001, 84.001);
  const c = marker(28, 88);
  let zoom = 8;
  const input = { markers: [a, b, c], map: { getZoom: () => zoom } };
  const algorithm = createLiveClusterAlgorithm();
  expect(
    algorithm
      .calculate(input)
      .clusters.map((cluster) => cluster.count)
      .sort(),
  ).toEqual([1, 2]);
  zoom = 17;
  expect(algorithm.calculate(input).clusters.map((cluster) => cluster.count)).toEqual([1, 1, 1]);
  zoom = 8;
  b.point = new LatLng(20, 75);
  expect(algorithm.calculate(input).clusters.map((cluster) => cluster.count)).toEqual([1, 1, 1]);
});
