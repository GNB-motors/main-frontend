import { describe, expect, it } from 'vitest';
import { fitPlaceLabel, placeLabelArea } from './placeAreaLabels.js';

const ring = (south, west, north, east) => [
  { lat: south, lng: west },
  { lat: south, lng: east },
  { lat: north, lng: east },
  { lat: north, lng: west },
];
const place = {
  id: 'p',
  name: 'Main yard',
  lat: 23,
  lng: 87,
  polygon: ring(22.999, 86.999, 23.001, 87.001),
};

describe('place labels inside visible areas', () => {
  it('keeps pins for the overview and small areas, and fits names as the area grows on screen', () => {
    const area = placeLabelArea(place);
    expect(fitPlaceLabel(place, area, 12, true)).toBeNull();
    expect(fitPlaceLabel(place, area, 15, true)).toBeNull();
    const layout = fitPlaceLabel(place, area, 18, true);
    expect(layout).toBeTruthy();
    expect(layout.position.lat).toBeGreaterThan(22.999);
    expect(layout.position.lat).toBeLessThan(23.001);
  });

  it('avoids a courtyard hole even when the place centroid lies in it', () => {
    const holed = {
      ...place,
      polygonParts: [[ring(22.99, 86.99, 23.01, 87.01), ring(22.998, 86.998, 23.002, 87.002)]],
    };
    const area = placeLabelArea(holed);
    const { lat, lng } = area.position;
    expect(lat < 22.998 || lat > 23.002 || lng < 86.998 || lng > 87.002).toBe(true);
    expect(fitPlaceLabel(holed, area, 18, false)).toBeTruthy();
  });

  it('puts the label in an L-shaped area rather than its empty bounding-box centre', () => {
    const concave = {
      ...place,
      polygon: [
        { lat: 23, lng: 87 },
        { lat: 23, lng: 87.01 },
        { lat: 23.002, lng: 87.01 },
        { lat: 23.002, lng: 87.002 },
        { lat: 23.01, lng: 87.002 },
        { lat: 23.01, lng: 87 },
      ],
    };
    const area = placeLabelArea(concave);
    expect(area.position.lat < 23.002 || area.position.lng < 87.002).toBe(true);
    expect(fitPlaceLabel(concave, area, 18, false)).toBeTruthy();
  });

  it('chooses a usable component of a multipart polygon', () => {
    const multi = {
      ...place,
      polygonParts: [[ring(23, 87, 23.00001, 87.00001)], [ring(24, 88, 24.01, 88.01)]],
    };
    expect(placeLabelArea(multi).position.lat).toBeGreaterThan(24);
  });

  it('labels circles only when that circle is actually being drawn', () => {
    const circle = { ...place, polygon: null, radiusM: 300 };
    const area = placeLabelArea(circle);
    expect(fitPlaceLabel(circle, area, 18, false)).toBeNull();
    expect(fitPlaceLabel(circle, area, 18, true)).toBeTruthy();
  });

  it('keeps markers for missing names, missing geometry, invalid or degenerate polygons', () => {
    expect(placeLabelArea({ lat: 23, lng: 87 })).toBeNull();
    expect(placeLabelArea({ polygon: [{ lat: NaN, lng: 87 }] })).toBeNull();
    expect(placeLabelArea({ polygon: Array(4).fill({ lat: 23, lng: 87 }) })).toBeNull();
    expect(fitPlaceLabel({ name: '  ' }, placeLabelArea(place), 20, true)).toBeNull();
  });
});
