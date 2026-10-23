/**
 * Pure helpers for Place Hub — no React, so they are unit-tested directly.
 *
 * Place Hub does not own a store. It reads the ones that already exist —
 * warehouses, geofence zones, Place Intelligence sites, fuel hotspots, idle
 * events — folds them into one list for one map, and sends every edit back to
 * the store it came from.
 */
import { effectiveType } from '../intelligence/model/siteType.js';
import { hasRisk, placeTitle } from '../intelligence/model/siteSummary.js';
import { groupOfType } from './placeGroups.js';
import { isNum, ringOf, toNum } from './placeGeometry.js';

export function fromWarehouse(w) {
  return {
    id: `warehouse:${w._id}`,
    source: 'warehouse',
    sourceId: String(w._id),
    name: w.name || 'Unnamed warehouse',
    type: 'WAREHOUSE',
    group: 'warehouse',
    status: 'CONFIRMED',
    lat: toNum(w.lat),
    lng: toNum(w.lng),
    radiusM: Number(w.geofenceRadiusM) || null,
    polygon: ringOf(w.polygon),
    subtitle: [w.code, w.city, w.state].filter(Boolean).join(' · '),
    readOnly: false,
    raw: w,
  };
}

export function fromZone(z) {
  const polygon = z.geofenceType === 'polygon' ? ringOf(z.polygonPath) : null;
  const entry = z.alertConfig?.alertOnEntry !== false;
  const exit = Boolean(z.alertConfig?.alertOnExit);
  return {
    id: `zone:${z._id}`,
    source: 'zone',
    sourceId: String(z._id),
    name: z.name || 'Unnamed zone',
    type: 'ZONE',
    group: 'zone',
    status: 'CONFIRMED',
    lat: toNum(z.lat),
    lng: toNum(z.lng),
    radiusM: polygon ? null : Number(z.radiusMetres) || 500,
    polygon,
    subtitle: alertSummary(entry, exit),
    alerts: { entry, exit },
    readOnly: false,
    raw: z,
  };
}

export function alertSummary(entry, exit) {
  if (entry && exit) return 'Alerts on entry and exit';
  if (entry) return 'Alerts on entry';
  if (exit) return 'Alerts on exit';
  return 'No alerts';
}

const SITE_GROUP_OF_STATUS = { PROPOSED: 'review', REJECTED: 'rejected' };

export function fromSite(s) {
  // The engine's reading when nobody has answered yet, so a suggestion shows as
  // "Fuel pump, Kolaghat" rather than "Unknown".
  const { type } = effectiveType(s);
  const erp = (s.origins || []).includes('ERP_DECLARED');
  const status = s.status || 'PROPOSED';
  return {
    id: `site:${s._id}`,
    source: 'site',
    sourceId: String(s._id),
    name: placeTitle(s),
    type,
    // Low evidence: nothing names the place yet and no trip ends there (backend reviewReady).
    group:
      status === 'PROPOSED' && s.lowEvidence
        ? 'low'
        : SITE_GROUP_OF_STATUS[status] || groupOfType(type),
    status,
    risk: hasRisk(s),
    reviewRank: Number.isInteger(s.reviewRank) ? s.reviewRank : null,
    lat: toNum(s.centroidLat),
    lng: toNum(s.centroidLng),
    radiusM: Number(s.radiusM) || null,
    polygon: ringOf(s.polygon),
    subtitle: s.address?.locality || s.address?.formatted || '',
    erp,
    readOnly: erp,
    readOnlyReason: erp
      ? 'A pickup or drop point from a delivery order. Change it from ERP.'
      : null,
    raw: s,
  };
}

const MIRROR_NOTE = 'Auto-managed mirror of a VehicleWarehouse';

/**
 * Every place, each real-world place once. A warehouse also lives as a zone
 * (the backend mirrors it for alerts) and as a Place Intelligence site (the
 * registry folds it in); both copies are dropped so the warehouse shows once.
 */
export function mergePlaces({ warehouses = [], zones = [], sites = [] } = {}) {
  const warehouseIds = new Set(warehouses.map((w) => String(w._id)));
  const mirrorZoneIds = new Set(
    warehouses.map((w) => w.geofenceZoneId && String(w.geofenceZoneId)).filter(Boolean),
  );

  const places = [
    ...warehouses.map(fromWarehouse),
    ...zones
      .filter((z) => !mirrorZoneIds.has(String(z._id)))
      .filter((z) => !String(z.description || '').startsWith(MIRROR_NOTE))
      .map(fromZone),
    ...sites
      .filter((s) => !s.supersededBy)
      .filter((s) => !warehouseIds.has(String(s.legacy?.vehicleWarehouseId || '')))
      .map(fromSite),
  ].filter((p) => isNum(p.lat) && isNum(p.lng));

  return places.sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0) ||
      (a.status === 'PROPOSED' ? byReviewPriority(a, b) : 0) ||
      a.name.localeCompare(b.name),
  );
}

const STATUS_ORDER = { CONFIRMED: 0, PROPOSED: 1, REJECTED: 2 };

/** The review queue's order first (it puts trip drops up front), then the busiest. */
function byReviewPriority(a, b) {
  const ra = a.reviewRank ?? Infinity;
  const rb = b.reviewRank ?? Infinity;
  if (ra !== rb) return ra - rb;
  return (Number(b.raw?.visitCount) || 0) - (Number(a.raw?.visitCount) || 0);
}
