import { decodeRoutes } from './routes.js';

/**
 * Delivery routes in the shape the Place Hub route map already draws.
 * `siteOf` enriches an endpoint with the org's place (type, address); the
 * row's own name and position are the fallback, so a route is never dropped
 * just because the places list has not loaded.
 */
export function deliveryMapModel(rows = [], siteOf = () => null) {
  const sites = new Map();
  const addSite = (id, name, position) => {
    if (!id || sites.has(String(id))) return;
    const known = siteOf(id);
    sites.set(String(id), {
      _id: String(id),
      name,
      ...(position || {}),
      ...(known || {}),
    });
  };
  const legs = rows.map((row) => {
    addSite(row.fromSiteId, row.fromName, row.fromPosition);
    addSite(row.toSiteId, row.toName, row.toPosition);
    return {
      ...row,
      kind: 'delivery',
      traversals: row.n || 0,
      stats: { km: row.km, minutes: row.minutes, fuelPerKm: row.fuelPerKm },
      path: row.path || { source: 'NONE', overviewSegments: [] },
      inPlant: false,
      sameRoadAsReverse: false,
    };
  });
  return decodeRoutes({ legs, sites: [...sites.values()] });
}

const overBy = (leg) => {
  const d = leg.sap?.comparison?.deltaKm;
  return leg.n && Number.isFinite(Number(d)) ? Number(d) : -Infinity;
};
const SORTS = {
  trips: (a, b) => (b.n || 0) - (a.n || 0),
  distance: (a, b) => (b.km?.p50 ?? -1) - (a.km?.p50 ?? -1),
  over: (a, b) => overBy(b) - overBy(a),
  name: (a, b) =>
    `${a.fromName} ${a.toName}`.localeCompare(`${b.fromName} ${b.toName}`, 'en', {
      sensitivity: 'base',
    }),
};

/** Place filter (from a map marker) and sort, applied to the loaded set. */
export function visibleDeliveries(legs, { siteId = null, sort = 'trips' } = {}) {
  const list = siteId
    ? legs.filter((l) => String(l.fromSiteId) === siteId || String(l.toSiteId) === siteId)
    : [...legs];
  return list.sort((a, b) => (SORTS[sort] || SORTS.trips)(a, b) || SORTS.name(a, b));
}
