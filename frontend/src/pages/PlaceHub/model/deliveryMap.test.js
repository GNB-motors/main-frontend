import { describe, expect, it } from 'vitest';
import { deliveryMapModel, visibleDeliveries } from './deliveryMap.js';

const row = (id, from, to, extra = {}) => ({
  _id: id,
  fromSiteId: from,
  toSiteId: to,
  fromName: `P${from}`,
  toName: `D${to}`,
  fromPosition: { lat: 22, lng: 88 },
  toPosition: { lat: 23, lng: 87 },
  n: 10,
  km: { p50: 100 },
  ...extra,
});

describe('deliveryMapModel', () => {
  it('builds sites from row endpoints and draws a link when no road is matched', () => {
    const { legs, sites } = deliveryMapModel([row('r1', 'a', 'b')]);
    expect(sites.get('a')).toMatchObject({ name: 'Pa', lat: 22, lng: 88 });
    expect(legs[0].traversals).toBe(10);
    expect(legs[0].path.source).toBe('NONE');
    expect(legs[0].segments[0].length).toBeGreaterThan(1);
  });
  it('prefers the org place record for an endpoint', () => {
    const { sites } = deliveryMapModel([row('r1', 'a', 'b')], (id) =>
      id === 'a' ? { name: 'Plant A', siteType: 'PLANT', lat: 22.1, lng: 88.1 } : null,
    );
    expect(sites.get('a')).toMatchObject({ name: 'Plant A', siteType: 'PLANT', lat: 22.1 });
  });
  it('keeps a route without positions but draws nothing for it', () => {
    const { legs } = deliveryMapModel([
      row('r1', 'a', 'b', { fromPosition: null, toPosition: null }),
    ]);
    expect(legs).toHaveLength(1);
    expect(legs[0].segments).toEqual([]);
  });
});

describe('visibleDeliveries', () => {
  const legs = [
    row('r1', 'a', 'b', { n: 5, km: { p50: 300 }, sap: { comparison: { deltaKm: 4 } } }),
    row('r2', 'c', 'b', { n: 50, km: { p50: 80 }, sap: { comparison: { deltaKm: 40 } } }),
    row('r3', 'a', 'd', { n: 0, km: { p50: null } }),
  ];
  it('sorts by trips, distance and most over SAP', () => {
    expect(visibleDeliveries(legs).map((l) => l._id)).toEqual(['r2', 'r1', 'r3']);
    expect(visibleDeliveries(legs, { sort: 'distance' }).map((l) => l._id)).toEqual([
      'r1',
      'r2',
      'r3',
    ]);
    expect(visibleDeliveries(legs, { sort: 'over' }).map((l) => l._id)).toEqual(['r2', 'r1', 'r3']);
  });
  it('filters to routes touching a place without mutating the input', () => {
    expect(visibleDeliveries(legs, { siteId: 'a' }).map((l) => l._id)).toEqual(['r1', 'r3']);
    expect(legs.map((l) => l._id)).toEqual(['r1', 'r2', 'r3']);
  });
});
