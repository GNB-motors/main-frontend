import { describe, it, expect } from 'vitest';
import { partsOf, ringOf } from './placeGeometry.js';

/** GeoJSON ring (lng, lat), closed. */
const square = (lng, lat, size = 0.1) => [
  [lng, lat],
  [lng + size, lat],
  [lng + size, lat + size],
  [lng, lat + size],
  [lng, lat],
];


/** GeoJSON hole ring (lng, lat), closed. */
const holeRing = [
  [88.02, 22.02],
  [88.04, 22.02],
  [88.04, 22.04],
  [88.02, 22.04],
  [88.02, 22.02],
];

/** GeoJSON ring (lng, lat), closed. */
const triangle = (lng, lat) => [
  [lng, lat],
  [lng + 0.1, lat],
  [lng, lat + 0.1],
  [lng, lat],
];

describe('partsOf', () => {
  it('reads a GeoJSON Polygon as one part: outer ring first, holes after', () => {
    const parts = partsOf({
      type: 'Polygon',
      coordinates: [square(88, 22), holeRing],
    });
    expect(parts).toHaveLength(1);
    expect(parts[0]).toHaveLength(2);
    expect(parts[0][0]).toEqual([
      { lat: 22, lng: 88 },
      { lat: 22, lng: 88.1 },
      { lat: 22.1, lng: 88.1 },
      { lat: 22.1, lng: 88 },
    ]);
    expect(parts[0][1]).toEqual([
      { lat: 22.02, lng: 88.02 },
      { lat: 22.02, lng: 88.04 },
      { lat: 22.04, lng: 88.04 },
      { lat: 22.04, lng: 88.02 },
    ]);
  });

  it('reads a MultiPolygon as one part per polygon', () => {
    const parts = partsOf({
      type: 'MultiPolygon',
      coordinates: [[square(88, 22)], [square(89, 23)]],
    });
    expect(parts).toHaveLength(2);
    expect(parts[0][0]).toHaveLength(4);
    expect(parts[1][0][0]).toEqual({ lat: 23, lng: 89 });
  });

  it('reads old [lat, lng] pairs as one ring', () => {
    expect(
      partsOf([
        [22, 88],
        [22, 88.1],
        [22.1, 88.1],
      ]),
    ).toEqual([
      [
        [
          { lat: 22, lng: 88 },
          { lat: 22, lng: 88.1 },
          { lat: 22.1, lng: 88.1 },
        ],
      ],
    ]);
  });

  it('reads {lat, lng} paths as one ring', () => {
    const parts = partsOf([
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
      { lat: 5, lng: 6 },
    ]);
    expect(parts).toHaveLength(1);
    expect(parts[0]).toHaveLength(1);
    expect(parts[0][0]).toEqual([
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
      { lat: 5, lng: 6 },
    ]);
  });

  it('drops the closing point and rings with fewer than 3 points', () => {
    const parts = partsOf({
      type: 'Polygon',
      coordinates: [square(88, 22), [[88.02, 22.02], [88.03, 22.03]]],
    });
    expect(parts).toHaveLength(1);
    expect(parts[0]).toHaveLength(1);
    expect(parts[0][0]).toHaveLength(4);
  });

  it('is null when there is nothing usable', () => {
    expect(partsOf(null)).toBeNull();
    expect(partsOf(undefined)).toBeNull();
    expect(partsOf({ type: 'Polygon' })).toBeNull();
    expect(partsOf([])).toBeNull();
  });
});

describe('ringOf', () => {
  it('keeps the outer ring of the largest part', () => {
    const ring = ringOf({
      type: 'MultiPolygon',
      coordinates: [[triangle(88, 22)], [square(89, 23)]],
    });
    expect(ring).toHaveLength(4);
    expect(ring[0]).toEqual({ lat: 23, lng: 89 });
  });

  it('keeps the outer ring of a polygon with a hole', () => {
    const ring = ringOf({
      type: 'Polygon',
      coordinates: [square(88, 22), holeRing],
    });
    expect(ring).toHaveLength(4);
    expect(ring[0]).toEqual({ lat: 22, lng: 88 });
  });
});
