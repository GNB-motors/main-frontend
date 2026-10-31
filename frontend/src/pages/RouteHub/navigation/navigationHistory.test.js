import { describe, expect, it } from 'vitest';
import { decodeNavigationPolyline, eligibilityLabel, plannedPath } from './navigationHistory';

const encode = (points) => {
  let previous = [0, 0];
  return points
    .map((point) =>
      point
        .map((value, axis) => {
          const n = Math.round(value * 1e6);
          const delta = n - previous[axis];
          previous[axis] = n;
          let bits = delta < 0 ? -delta * 2 - 1 : delta * 2;
          let output = '';
          while (bits >= 32) {
            output += String.fromCharCode((bits % 32) + 95);
            bits = Math.floor(bits / 32);
          }
          return output + String.fromCharCode(bits + 63);
        })
        .join(''),
    )
    .join('');
};

describe('navigation replay geometry', () => {
  it('preserves polyline6 coordinates and direction rather than treating it as polyline5', () => {
    const geometry = encode([
      [22.123456, 88.123456],
      [22.124321, 88.122345],
    ]);
    expect(plannedPath({ route: { polyline6: geometry } })).toEqual([
      { lat: 22.123456, lng: 88.123456 },
      { lat: 22.124321, lng: 88.122345 },
    ]);
  });
  it('rejects truncated, malformed and out of range coordinates', () => {
    for (const input of [
      '_',
      '????????_',
      '\u0000',
      encode([
        [91, 88],
        [91.1, 88.1],
      ]),
    ]) {
      expect(decodeNavigationPolyline(input)).toEqual([]);
    }
  });
  it('does not connect explicit gaps or interpret unknown string geometry precision', () => {
    expect(
      plannedPath({
        geometry: {
          polyline6: encode([
            [22, 88],
            [23, 89],
          ]),
          gaps: [1],
        },
      }),
    ).toEqual([]);
    expect(
      plannedPath({ navigation: { payload: { routes: [{ geometry: 'unknown-precision' }] } } }),
    ).toEqual([]);
  });
  it('reads longitude-first GeoJSON safely without drawing invalid points', () => {
    const snapshot = {
      navigation: {
        payload: {
          routes: [
            {
              geometry: {
                type: 'LineString',
                coordinates: [
                  [88, 22],
                  [89, 23],
                ],
              },
            },
          ],
        },
      },
    };
    expect(plannedPath(snapshot)).toEqual([
      { lat: 22, lng: 88 },
      { lat: 23, lng: 89 },
    ]);
    snapshot.navigation.payload.routes[0].geometry.coordinates.push([181, 22]);
    expect(plannedPath(snapshot)).toEqual([]);
  });
});

it('does not promote missing eligibility or a suspended resource to approved navigation', () => {
  expect(eligibilityLabel({})).toBe('Not assessed');
  expect(eligibilityLabel({ eligible: true })).toBe('Eligible for route validation');
  expect(eligibilityLabel({ eligible: true, status: 'SUSPENDED' })).toBe('Suspended');
});
