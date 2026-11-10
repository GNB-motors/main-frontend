import { describe, it, expect } from 'vitest';
import {
  confirmedPlaces,
  countPlacesByGroup,
  placesInGroups,
  placeContains,
  vehiclesAtPlace,
  searchPlaces,
  vehicleCountsByPlace,
} from './trackPlaces.js';

const site = (id, status, extra = {}) => ({
  _id: id,
  status,
  siteType: 'LOADING',
  name: `Site ${id}`,
  centroidLat: 22.5,
  centroidLng: 88.3,
  radiusM: 300,
  ...extra,
});

describe('Places shown on Track', () => {
  it('keeps confirmed places only — never suggestions, low evidence or "not a place"', () => {
    const places = confirmedPlaces({
      warehouses: [{ _id: 'w1', name: 'Dankuni WH', lat: 22.7, lng: 88.2, geofenceRadiusM: 400 }],
      sites: [
        site('s1', 'CONFIRMED'),
        site('s2', 'PROPOSED'),
        site('s3', 'PROPOSED', { lowEvidence: true }),
        site('s4', 'REJECTED'),
      ],
    });
    expect(places.map((p) => p.id).sort()).toEqual(['site:s1', 'warehouse:w1']);
  });

  it('shows a warehouse once even though it is mirrored as a zone and a site', () => {
    const places = confirmedPlaces({
      warehouses: [{ _id: 'w1', name: 'WH', lat: 22.7, lng: 88.2, geofenceZoneId: 'z1' }],
      zones: [{ _id: 'z1', name: 'WH zone', lat: 22.7, lng: 88.2, radiusMetres: 400 }],
      sites: [site('s1', 'CONFIRMED', { legacy: { vehicleWarehouseId: 'w1' } })],
    });
    expect(places.map((p) => p.id)).toEqual(['warehouse:w1']);
  });

  it('counts and filters by Place Hub group', () => {
    const places = confirmedPlaces({
      warehouses: [{ _id: 'w1', name: 'WH', lat: 22.7, lng: 88.2 }],
      sites: [site('s1', 'CONFIRMED'), site('s2', 'CONFIRMED', { siteType: 'FUEL_PUMP' })],
    });
    expect(countPlacesByGroup(places)).toMatchObject({ warehouse: 1, trade: 1, road: 1 });
    expect(
      placesInGroups(places, new Set(['road']))
        .map((p) => p.group)
        .sort(),
    ).toEqual(['trade', 'warehouse']);
  });
});

describe('Vehicles inside a place', () => {
  const circle = { lat: 22.5, lng: 88.3, radiusM: 300, polygon: null };
  const square = {
    lat: 22.5,
    lng: 88.3,
    radiusM: null,
    polygon: [
      { lat: 22.49, lng: 88.29 },
      { lat: 22.49, lng: 88.31 },
      { lat: 22.51, lng: 88.31 },
      { lat: 22.51, lng: 88.29 },
    ],
  };
  it('uses the radius for a circular place', () => {
    expect(placeContains(circle, 22.5015, 88.3)).toBe(true); // ~170 m
    expect(placeContains(circle, 22.505, 88.3)).toBe(false); // ~555 m
  });
  it('uses the drawn boundary for a polygon place', () => {
    expect(placeContains(square, 22.5, 88.3)).toBe(true);
    expect(placeContains(square, 22.52, 88.3)).toBe(false);
  });
  it('lists only trucks with a live GPS fix inside the place', () => {
    const vehicles = [
      { id: 'a', hasFix: true, hasGpsFix: true, lat: 22.5, lng: 88.3 },
      { id: 'b', hasFix: true, hasGpsFix: true, lat: 23, lng: 88.3 },
      { id: 'c', hasFix: false, lat: null, lng: null },
      { id: 'offline', hasFix: true, hasGpsFix: false, lat: 22.5, lng: 88.3 },
    ];
    expect(vehiclesAtPlace(circle, vehicles).map((v) => v.id)).toEqual(['a']);
  });
});

describe('Places tab list', () => {
  const places = [
    {
      id: 'a',
      name: 'Dankuni Warehouse',
      type: 'WAREHOUSE',
      subtitle: 'Hooghly',
      lat: 22.5,
      lng: 88.3,
      radiusM: 300,
      polygon: null,
    },
    {
      id: 'b',
      name: 'Kolaghat Plant',
      type: 'PLANT',
      subtitle: 'Purba Medinipur',
      lat: 23,
      lng: 88,
      radiusM: 300,
      polygon: null,
    },
  ];
  it('searches name, address and type', () => {
    expect(searchPlaces(places, 'kola').map((p) => p.id)).toEqual(['b']);
    expect(searchPlaces(places, 'hooghly').map((p) => p.id)).toEqual(['a']);
    expect(searchPlaces(places, 'plant').map((p) => p.id)).toEqual(['b']);
    expect(searchPlaces(places, '  ')).toBe(places);
  });
  it('counts vehicles inside each place', () => {
    const counts = vehicleCountsByPlace(places, [
      { hasFix: true, hasGpsFix: true, lat: 22.5, lng: 88.3 },
      { hasFix: true, hasGpsFix: true, lat: 22.5001, lng: 88.3 },
      { hasFix: false, lat: 23, lng: 88 },
    ]);
    expect(counts.get('a')).toBe(2);
    expect(counts.get('b')).toBe(0);
  });
});
