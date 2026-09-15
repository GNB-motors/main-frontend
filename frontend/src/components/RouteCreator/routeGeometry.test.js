import { describe, it, expect } from 'vitest';
import {
  encodePolyline,
  decodePolyline,
  extractEncodedPolyline,
  extractBounds,
  buildRouteGeometry,
  unionBounds,
} from './routeGeometry.js';

// Google's canonical example: three points around California.
const PATH = [
  { lat: 38.5, lng: -120.2 },
  { lat: 40.7, lng: -120.95 },
  { lat: 43.252, lng: -126.453 },
];
const ENCODED = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';

const latLng = ({ lat, lng }) => ({
  lat: () => lat,
  lng: () => lng,
});

describe('decodePolyline', () => {
  it('decodes the canonical precision-5 example', () => {
    expect(decodePolyline(ENCODED)).toEqual(PATH);
  });

  it('returns [] for empty or missing input', () => {
    expect(decodePolyline('')).toEqual([]);
    expect(decodePolyline(null)).toEqual([]);
    expect(decodePolyline(undefined)).toEqual([]);
  });

  it('round-trips through encodePolyline', () => {
    PATH.forEach((p, i) => {
      expect(decodePolyline(encodePolyline(PATH))[i]).toEqual(p);
    });
  });
});

describe('encodePolyline', () => {
  it('matches the canonical encoding exactly', () => {
    expect(encodePolyline(PATH)).toBe(ENCODED);
  });

  it('accepts LatLng-like objects with lat()/lng() accessors', () => {
    expect(encodePolyline(PATH.map(latLng))).toBe(ENCODED);
  });

  it('produces "" for empty input and skips points without coordinates', () => {
    expect(encodePolyline([])).toBe('');
    expect(encodePolyline([{ lat: null, lng: undefined }])).toBe('');
  });
});

describe('extractEncodedPolyline', () => {
  it('passes through a plain string overview_polyline', () => {
    expect(extractEncodedPolyline({ overview_polyline: ENCODED })).toBe(ENCODED);
  });

  it('unwraps an {points} overview_polyline (field-name trap)', () => {
    expect(extractEncodedPolyline({ overview_polyline: { points: ENCODED } })).toBe(ENCODED);
  });

  it('encodes overview_path when no encoded form exists', () => {
    expect(extractEncodedPolyline({ overview_path: PATH.map(latLng) })).toBe(ENCODED);
  });

  it('returns null when nothing usable is present', () => {
    expect(extractEncodedPolyline({})).toBeNull();
    expect(extractEncodedPolyline({ overview_polyline: '' })).toBeNull();
    expect(extractEncodedPolyline(null)).toBeNull();
  });
});

describe('extractBounds', () => {
  it('reads getNorthEast()/getSouthWest() LatLngBounds', () => {
    const bounds = {
      getNorthEast: () => latLng({ lat: 43.252, lng: -120.2 }),
      getSouthWest: () => latLng({ lat: 38.5, lng: -126.453 }),
    };
    expect(extractBounds({ bounds })).toEqual({
      north: 43.252,
      south: 38.5,
      east: -120.2,
      west: -126.453,
    });
  });

  it('reads plain-literal bounds too', () => {
    const bounds = { getNorthEast: { lat: 10, lng: 20 }, getSouthWest: { lat: 1, lng: 2 } };
    expect(extractBounds({ bounds })).toEqual({ north: 10, south: 1, east: 20, west: 2 });
  });

  it('returns null when bounds are missing or partial', () => {
    expect(extractBounds({})).toBeNull();
    expect(
      extractBounds({ bounds: { getNorthEast: () => null, getSouthWest: () => null } }),
    ).toBeNull();
  });
});

describe('buildRouteGeometry', () => {
  const route = {
    overview_polyline: ENCODED,
    overview_path: PATH.map(latLng),
    bounds: {
      getNorthEast: () => latLng({ lat: 43.252, lng: -120.2 }),
      getSouthWest: () => latLng({ lat: 38.5, lng: -126.453 }),
    },
  };

  it('builds the full persisted geometry shape', () => {
    const fetchedAt = '2026-09-01T12:00:00.000Z';
    expect(buildRouteGeometry(route, { distanceMeters: 273_152, fetchedAt })).toEqual({
      encodedPolyline: ENCODED,
      bounds: { north: 43.252, south: 38.5, east: -120.2, west: -126.453 },
      pointCount: 3,
      provider: 'GOOGLE_DIRECTIONS',
      fetchedAt,
      distanceMeters: 273_152,
    });
  });

  it('defaults distanceMeters to null and pointCount to null without overview_path', () => {
    const geometry = buildRouteGeometry(
      { overview_polyline: ENCODED },
      { fetchedAt: '2026-09-01T12:00:00.000Z' },
    );
    expect(geometry.distanceMeters).toBeNull();
    expect(geometry.pointCount).toBeNull();
    expect(geometry.bounds).toBeNull();
  });

  it('emits an ISO fetchedAt by default', () => {
    expect(Number.isNaN(Date.parse(buildRouteGeometry(route).fetchedAt))).toBe(false);
  });
});

describe('unionBounds', () => {
  it('finds the extreme edges across bounds', () => {
    expect(
      unionBounds([
        { north: 10, south: 5, east: 30, west: 20 },
        { north: 20, south: 1, east: 25, west: 10 },
      ]),
    ).toEqual({ north: 20, south: 1, east: 30, west: 10 });
  });

  it('ignores null and partial entries, and returns null when none are usable', () => {
    expect(unionBounds([null, { north: 10, south: 5 }])).toBeNull();
    expect(unionBounds([])).toBeNull();
    expect(unionBounds(undefined)).toBeNull();
  });
});
