import { describe, it, expect } from 'vitest';
import {
  canEditPlaces,
  hasPosition,
  ringOf,
  centroidOf,
  mergePlaces,
  filterPlaces,
  countByGroup,
  placeTotals,
  clusterIdleEvents,
  liveIdleTotals,
  idleHistoryTotals,
  fromHotspot,
  drainCellsOf,
  fuelTotals,
  newDraft,
  draftFromPlace,
  validateDraft,
  payloadFor,
  addressParts,
  radiusLabel,
  durationLabel,
} from './placeHubModel.js';

const warehouse = {
  _id: 'w1',
  name: 'Dankuni yard',
  code: 'DKN',
  lat: 22.68,
  lng: 88.29,
  geofenceRadiusM: 300,
  geofenceZoneId: 'z-mirror',
  city: 'Dankuni',
};
const mirrorZone = {
  _id: 'z-mirror',
  name: 'Warehouse: Dankuni yard',
  lat: 22.68,
  lng: 88.29,
  radiusMetres: 300,
};
const zone = {
  _id: 'z1',
  name: 'Tata gate 3',
  lat: 22.8,
  lng: 86.2,
  radiusMetres: 400,
  geofenceType: 'circular',
  alertConfig: { alertOnEntry: true, alertOnExit: true },
};
const site = (over) => ({
  _id: 's1',
  name: 'Loading bay',
  siteType: 'LOADING',
  status: 'CONFIRMED',
  centroidLat: 23.1,
  centroidLng: 86.9,
  radiusM: 150,
  origins: ['ENGINE'],
  ...over,
});

describe('canEditPlaces', () => {
  it('lets managers edit and nobody else', () => {
    expect(canEditPlaces('OWNER')).toBe(true);
    expect(canEditPlaces('manager')).toBe(true);
    expect(canEditPlaces('DRIVER')).toBe(false);
    expect(canEditPlaces(null)).toBe(false);
  });
});

describe('ringOf', () => {
  it('reads a GeoJSON ring as lng,lat and drops the closing point', () => {
    const ring = ringOf({
      type: 'Polygon',
      coordinates: [
        [
          [88, 22],
          [88.1, 22],
          [88.1, 22.1],
          [88, 22],
        ],
      ],
    });
    expect(ring).toEqual([
      { lat: 22, lng: 88 },
      { lat: 22, lng: 88.1 },
      { lat: 22.1, lng: 88.1 },
    ]);
  });

  it('reads old [lat, lng] pairs and {lat, lng} paths', () => {
    expect(
      ringOf([
        [22, 88],
        [22, 88.1],
        [22.1, 88.1],
      ])[0],
    ).toEqual({ lat: 22, lng: 88 });
    expect(
      ringOf([
        { lat: 1, lng: 2 },
        { lat: 3, lng: 4 },
        { lat: 5, lng: 6 },
      ]),
    ).toHaveLength(3);
  });

  it('is null for anything that is not a usable ring', () => {
    expect(ringOf(null)).toBeNull();
    expect(
      ringOf([
        [22, 88],
        [22, 88.1],
      ]),
    ).toBeNull();
    expect(ringOf({ type: 'Polygon' })).toBeNull();
  });
});

describe('hasPosition', () => {
  it('treats null and blank coordinates as missing, not as 0', () => {
    expect(hasPosition({ lat: 22.5, lng: '88.3' })).toBe(true);
    expect(hasPosition({ lat: 0, lng: 0 })).toBe(true);
    expect(hasPosition({ lat: null, lng: 88 })).toBe(false);
    expect(hasPosition({ lat: '', lng: 88 })).toBe(false);
    expect(hasPosition(null)).toBe(false);
  });
});

describe('centroidOf', () => {
  it('averages the points', () => {
    expect(
      centroidOf([
        { lat: 0, lng: 0 },
        { lat: 2, lng: 4 },
      ]),
    ).toEqual({ lat: 1, lng: 2 });
    expect(centroidOf([])).toBeNull();
  });
});

describe('mergePlaces', () => {
  it('shows a warehouse once, dropping its mirror zone and its registry copy', () => {
    const places = mergePlaces({
      warehouses: [warehouse],
      zones: [mirrorZone, zone],
      sites: [
        site({ _id: 's-wh', siteType: 'WAREHOUSE', legacy: { vehicleWarehouseId: 'w1' } }),
        site(),
      ],
    });
    expect(places.map((p) => p.id).sort()).toEqual(['site:s1', 'warehouse:w1', 'zone:z1']);
  });

  it('drops a mirror zone by its note even when the link is missing', () => {
    const orphan = {
      ...mirrorZone,
      _id: 'z9',
      description: 'Auto-managed mirror of a VehicleWarehouse. Edit…',
    };
    expect(mergePlaces({ zones: [orphan] })).toEqual([]);
  });

  it('skips rejected and superseded sites and puts proposals last', () => {
    const places = mergePlaces({
      sites: [
        site({ _id: 'a', name: 'A', status: 'PROPOSED' }),
        site({ _id: 'b', name: 'B' }),
        site({ _id: 'c', status: 'REJECTED' }),
        site({ _id: 'd', supersededBy: 'b' }),
      ],
    });
    expect(places.map((p) => p.sourceId)).toEqual(['b', 'a']);
    expect(places[1].group).toBe('review');
  });

  it('marks ERP pickup/drop sites read-only', () => {
    const [p] = mergePlaces({ sites: [site({ origins: ['ERP_DECLARED'] })] });
    expect(p.readOnly).toBe(true);
    expect(p.erp).toBe(true);
  });

  it('reads zone polygons and alert config', () => {
    const [p] = mergePlaces({
      zones: [
        {
          ...zone,
          geofenceType: 'polygon',
          polygonPath: [
            { lat: 1, lng: 1 },
            { lat: 1, lng: 2 },
            { lat: 2, lng: 2 },
          ],
        },
      ],
    });
    expect(p.polygon).toHaveLength(3);
    expect(p.radiusM).toBeNull();
    expect(p.alerts).toEqual({ entry: true, exit: true });
  });
});

describe('filter, counts and totals', () => {
  const places = mergePlaces({
    warehouses: [warehouse],
    zones: [zone],
    sites: [site(), site({ _id: 'p', name: 'Maybe', status: 'PROPOSED' })],
  });

  it('filters by group and by text', () => {
    expect(filterPlaces(places, { group: 'zone' }).map((p) => p.sourceId)).toEqual(['z1']);
    expect(filterPlaces(places, { query: 'dank' }).map((p) => p.sourceId)).toEqual(['w1']);
    expect(filterPlaces(places, { query: 'loading point' }).map((p) => p.sourceId)).toEqual(['s1']);
    expect(filterPlaces(places, { group: 'review' }).map((p) => p.sourceId)).toEqual(['p']);
  });

  it('keeps proposals out of "All" and out of the place total', () => {
    expect(filterPlaces(places).map((p) => p.sourceId)).not.toContain('p');
    expect(countByGroup(places)).toMatchObject({
      all: 3,
      warehouse: 1,
      zone: 1,
      trade: 1,
      review: 1,
    });
    expect(placeTotals(places)).toEqual({ places: 3, warehouses: 1, zones: 1, toReview: 1 });
  });
});

describe('idling', () => {
  const ev = (over) => ({
    lat: 22.5,
    lng: 88.3,
    durationMin: 60,
    rupees: 100,
    legitimacy: 'excess',
    registrationNumber: 'WB11A1',
    startAt: '2026-10-01T00:00:00Z',
    ...over,
  });

  it('groups nearby idles into one spot and ranks by excess money', () => {
    const spots = clusterIdleEvents([
      ev(),
      ev({ lat: 22.5004, registrationNumber: 'WB11A2', legitimacy: 'legit', rupees: 50 }),
      ev({ lat: 23.5, rupees: 900 }),
    ]);
    expect(spots).toHaveLength(2);
    expect(spots[0].excessRupees).toBe(900);
    expect(spots[1]).toMatchObject({ events: 2, rupees: 150, excessRupees: 100, hours: 2 });
    expect(spots[1].trucks).toEqual(['WB11A1', 'WB11A2']);
    expect(spots[1].excessShare).toBeCloseTo(2 / 3);
  });

  it('ignores events without a position', () => {
    expect(clusterIdleEvents([ev({ lat: null })])).toEqual([]);
  });

  it('totals live and closed idling', () => {
    expect(liveIdleTotals([ev(), ev({ legitimacy: 'legit', rupees: 20 })])).toEqual({
      count: 2,
      excessCount: 1,
      rupees: 120,
      excessRupees: 100,
    });
    expect(idleHistoryTotals([ev(), ev({ durationMin: 30 })])).toEqual({
      events: 2,
      hours: 1.5,
      rupees: 200,
      excessRupees: 200,
    });
  });
});

describe('fuel risk', () => {
  it('labels hotspots by who they came from', () => {
    expect(fromHotspot({ _id: 'h', orgId: null, centerLat: 1, centerLng: 2 }).provenance).toBe(
      'network',
    );
    expect(
      fromHotspot({ _id: 'h', orgId: 'o', source: 'MANUAL', centerLat: 1, centerLng: 2 }).readOnly,
    ).toBe(false);
    expect(fromHotspot({ _id: 'h', orgId: 'o', centerLat: 1, centerLng: 2 }).radiusM).toBe(500);
  });

  it('reads drain buckets and totals the active ones', () => {
    const cells = drainCellsOf({
      buckets: [
        { cell: 'x', centerLat: 1, centerLng: 2, count: 3, totalLitres: 40, estimatedInr: 3600 },
      ],
    });
    expect(cells[0]).toMatchObject({ id: 'drain:x', events: 3, rupees: 3600, vehicles: [] });
    const hotspots = [
      fromHotspot({ _id: 'a', orgId: 'o', centerLat: 1, centerLng: 1 }),
      fromHotspot({ _id: 'b', orgId: 'o', centerLat: 1, centerLng: 1, active: false }),
      fromHotspot({ _id: 'c', orgId: null, centerLat: 1, centerLng: 1 }),
    ];
    expect(fuelTotals(hotspots, cells)).toEqual({
      active: 1,
      network: 1,
      drainRupees: 3600,
      drainEvents: 3,
    });
    expect(drainCellsOf(null)).toEqual([]);
  });
});

describe('editor', () => {
  const center = { lat: 22.6, lng: 88.4 };

  it('requires a name, a pin inside India and a radius in range', () => {
    const d = newDraft('WAREHOUSE');
    expect(Object.keys(validateDraft(d)).sort()).toEqual(['name', 'shape']);
    expect(validateDraft({ ...d, name: 'Yard', center, radiusM: 50 })).toHaveProperty('radiusM');
    expect(validateDraft({ ...d, name: 'Yard', center: { lat: 51, lng: 0 } })).toHaveProperty(
      'shape',
    );
    expect(validateDraft({ ...d, name: 'Yard', center })).toEqual({});
  });

  it('requires a closed outline for a drawn zone', () => {
    const d = { ...newDraft('ZONE'), name: 'Gate', shape: 'polygon', polygon: [center, center] };
    expect(validateDraft(d).shape).toMatch(/3 points/);
    expect(validateDraft({ ...d, polygon: [center, center, center] }).shape).toMatch(/Finish/);
    expect(validateDraft({ ...d, polygon: [center, center, center], polygonDone: true })).toEqual(
      {},
    );
  });

  it('builds each store its own body', () => {
    expect(
      payloadFor({
        ...newDraft('WAREHOUSE'),
        name: ' Yard ',
        code: 'dkn',
        center,
        radiusM: '350.4',
      }),
    ).toMatchObject({ name: 'Yard', code: 'DKN', lat: 22.6, lng: 88.4, geofenceRadiusM: 350 });

    const poly = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 2 },
      { lat: 2, lng: 2 },
    ];
    expect(
      payloadFor({
        ...newDraft('ZONE'),
        name: 'Z',
        shape: 'polygon',
        polygon: poly,
        polygonDone: true,
      }),
    ).toMatchObject({
      geofenceType: 'polygon',
      radiusMetres: 0,
      polygonPath: poly,
      lat: 2 / 3,
      lng: 4 / 3,
    });

    expect(payloadFor({ ...newDraft('HOTSPOT'), name: 'H', center, radiusM: 500 })).toEqual({
      name: 'H',
      centerLat: 22.6,
      centerLng: 88.4,
      radiusM: 500,
    });
  });

  it('only drafts places this page can edit', () => {
    const all = mergePlaces({ warehouses: [warehouse], zones: [zone], sites: [site()] });
    const [w, z, s] = ['warehouse', 'zone', 'site'].map((src) => all.find((p) => p.source === src));
    expect(draftFromPlace(w)).toMatchObject({
      kind: 'WAREHOUSE',
      mode: 'edit',
      sourceId: 'w1',
      code: 'DKN',
    });
    expect(draftFromPlace(z)).toMatchObject({ kind: 'ZONE', alertOnExit: true, shape: 'circle' });
    expect(draftFromPlace(s)).toBeNull();
    expect(
      draftFromPlace(fromHotspot({ _id: 'n', orgId: null, centerLat: 1, centerLng: 1 })),
    ).toBeNull();
    expect(
      draftFromPlace(fromHotspot({ _id: 'o', orgId: 'x', centerLat: 1, centerLng: 1 })),
    ).toMatchObject({
      kind: 'HOTSPOT',
      sourceId: 'o',
    });
  });

  it('lifts address fields out of a geocoder result', () => {
    const result = {
      formatted_address: 'NH19, Dankuni, West Bengal 712311',
      address_components: [
        { long_name: 'Dankuni', types: ['locality'] },
        { long_name: 'West Bengal', types: ['administrative_area_level_1'] },
        { long_name: '712311', types: ['postal_code'] },
      ],
    };
    expect(addressParts(result)).toEqual({
      address: 'NH19, Dankuni, West Bengal 712311',
      city: 'Dankuni',
      state: 'West Bengal',
      pincode: '712311',
    });
  });
});

describe('labels', () => {
  it('formats radius and duration', () => {
    expect(radiusLabel(300)).toBe('300 m');
    expect(radiusLabel(1500)).toBe('1.5 km');
    expect(radiusLabel(25000)).toBe('25 km');
    expect(durationLabel(45)).toBe('45 min');
    expect(durationLabel(135)).toBe('2h 15m');
    expect(durationLabel(1500)).toBe('1d 1h');
  });
});
