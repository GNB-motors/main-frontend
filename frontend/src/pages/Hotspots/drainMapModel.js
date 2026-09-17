import dayjs from 'dayjs';

/**
 * Pure helpers for the Fuel Drain Hotspot Map (feature #8).
 *
 * The backend (GET /api/hotspots/map) returns coordinate-cell buckets:
 *   { cell, centerLat, centerLng, count, vehicleIds[], vehicles[],
 *     totalLitres, estimatedInr }
 * These functions turn that payload into map styling + summary rollups. They
 * are deliberately free of React / Google Maps so they can be unit-tested.
 *
 * The map NEVER geocodes a bucket up front — see reverseGeocode in the page,
 * which resolves a single clicked cell centre on demand (the CLAUDE.md
 * geocoding landmine).
 */

export const DEFAULT_RANGE_DAYS = 90;

// Severity ramp keyed off a bucket's share of the heaviest bucket's ₹ loss.
// Estimates only — the map means "review", never an accusation.
export const SEVERITY_TIERS = [
  { key: 'critical', minShare: 0.75, color: '#DC2626', label: 'Critical' },
  { key: 'high', minShare: 0.5, color: '#F97316', label: 'High' },
  { key: 'medium', minShare: 0.25, color: '#FB923C', label: 'Medium' },
  { key: 'low', minShare: 0, color: '#FDE68A', label: 'Low' },
];

/** ISO from/to for the last `days` window, ending at `now`. */
export function rangeFromDays(days = DEFAULT_RANGE_DAYS, now = Date.now()) {
  const to = dayjs(now);
  const from = to.subtract(days, 'day');
  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * Backend bbox string from a viewport. Order is minLng,minLat,maxLng,maxLat
 * (west,south,east,north) — the same order the endpoint validates. Returns
 * null when any edge is non-finite so callers can simply omit the param.
 */
export function toBboxString({ west, south, east, north } = {}) {
  const edges = [west, south, east, north];
  if (edges.some((n) => !Number.isFinite(n))) return null;
  return `${west},${south},${east},${north}`;
}

/** Read a Google Maps LatLngBounds into a plain {west,south,east,north}. */
export function boundsToBox(bounds) {
  if (!bounds || typeof bounds.getSouthWest !== 'function') return null;
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  return { west: sw.lng(), south: sw.lat(), east: ne.lng(), north: ne.lat() };
}

/** Severity tier for a bucket given the heaviest bucket's ₹ loss. */
export function severityOf(estimatedInr, maxInr) {
  const share = maxInr > 0 ? estimatedInr / maxInr : 0;
  return (
    SEVERITY_TIERS.find((t) => share >= t.minShare) || SEVERITY_TIERS[SEVERITY_TIERS.length - 1]
  );
}

/**
 * Circle radius (metres) for a bucket, scaled by litres lost and clamped so a
 * single small drain stays visible and a heavy cell never swallows the grid.
 */
export function bucketRadiusMeters(totalLitres, { min = 400, max = 4000, k = 90 } = {}) {
  const litres = Number.isFinite(totalLitres) && totalLitres > 0 ? totalLitres : 0;
  return Math.min(max, min + k * Math.sqrt(litres));
}

/** Map-circle style for a bucket (fill/stroke from its severity tier). */
export function bucketStyle(bucket, maxInr) {
  const tier = severityOf(bucket?.estimatedInr ?? 0, maxInr);
  return {
    tier: tier.key,
    color: tier.color,
    radiusMeters: bucketRadiusMeters(bucket?.totalLitres),
  };
}

/** The heaviest bucket's ₹ loss — the denominator for severity shares. */
export function maxInrOf(buckets = []) {
  return buckets.reduce((m, b) => Math.max(m, b?.estimatedInr ?? 0), 0);
}

/**
 * Fleet-wide rollup across all buckets in view: cell count, total litres lost,
 * total ₹ estimate, and the number of DISTINCT vehicles involved (deduped by
 * vehicleId, falling back to registration when no id was resolved).
 */
export function summariseBuckets(buckets = []) {
  const vehicles = new Set();
  let totalLitres = 0;
  let totalInr = 0;
  let events = 0;
  for (const b of buckets) {
    totalLitres += b?.totalLitres ?? 0;
    totalInr += b?.estimatedInr ?? 0;
    events += b?.count ?? 0;
    for (const id of b?.vehicleIds ?? []) vehicles.add(String(id));
    // registration-only vehicles (no resolved id) still count once each
    const ids = new Set((b?.vehicleIds ?? []).map(String));
    if (!ids.size) for (const reg of b?.vehicles ?? []) vehicles.add(`reg:${reg}`);
  }
  return {
    cells: buckets.length,
    events,
    totalLitres: Math.round(totalLitres * 100) / 100,
    totalInr: Math.round(totalInr),
    vehicles: vehicles.size,
  };
}
