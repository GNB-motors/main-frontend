/**
 * Pure helpers for Place Hub — no React, so they are unit-tested directly.
 *
 * Place Hub does not own a store. It reads the ones that already exist —
 * warehouses, geofence zones, Place Intelligence sites, fuel hotspots, idle
 * events — folds them into one list for one map, and sends every edit back to
 * the store it came from.
 */
import {
  typeLabel,
  effectiveType,
  hasRisk,
  placeTitle,
  groupBreaks,
} from './intelligence/placeIntelligenceModel.js';
import { provenanceOf } from '../../services/HotspotService.js';

export const EDITOR_ROLES = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];
export const canEditPlaces = (role) => EDITOR_ROLES.includes(String(role || '').toUpperCase());

export const TAB_IDS = [
  'places',
  'idling',
  'fuel',
  'stops',
  'routes',
  'facilities',
  'regions',
  'homes',
  'shadow',
];

/* ─── Place types and groups ─────────────────────────────────────────────── */

const GROUP_OF_TYPE = {
  WAREHOUSE: 'warehouse',
  YARD: 'warehouse',
  ZONE: 'zone',
  LOADING: 'trade',
  UNLOADING: 'trade',
  PLANT: 'trade',
  FUEL_PUMP: 'road',
  DHABA: 'road',
  TOLL: 'road',
  CHECKPOST: 'road',
  PARKING: 'road',
  WORKSHOP: 'road',
  SERVICE: 'road',
};

export const PLACE_GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'warehouse', label: 'Warehouses' },
  { id: 'zone', label: 'Zones' },
  { id: 'trade', label: 'Load & unload' },
  { id: 'road', label: 'On the road' },
  { id: 'other', label: 'Other' },
  { id: 'risk', label: 'Fuel risk' },
  { id: 'review', label: 'To review' },
  { id: 'rejected', label: 'Not a place' },
];

/** Groups that sit outside "All places": suggestions, and places said not to exist. */
const SET_ASIDE = new Set(['review', 'rejected']);

export function groupOfType(type) {
  return GROUP_OF_TYPE[type] || 'other';
}

export function placeTypeLabel(type) {
  if (type === 'ZONE') return 'Geofence zone';
  if (type === 'HOTSPOT') return 'Fuel risk hotspot';
  return typeLabel(type);
}

/* ─── Geometry ───────────────────────────────────────────────────────────── */

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
/** Number() turns null and '' into 0 — a real coordinate — so those become NaN here. */
const toNum = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));

/**
 * A polygon as [{lat, lng}] from any of the shapes the stores use: GeoJSON
 * ([lng, lat] ring — OrgSite, VehicleWarehouse), old OrgSite [[lat, lng]]
 * pairs, or GeofenceZone's [{lat, lng}]. Null when there is no usable ring.
 */
export function ringOf(polygon) {
  if (!polygon) return null;
  let points = [];
  if (Array.isArray(polygon.coordinates)) {
    const ring = polygon.coordinates[0] || [];
    points = ring.map((p) => ({ lat: toNum(p?.[1]), lng: toNum(p?.[0]) }));
  } else if (Array.isArray(polygon)) {
    points = polygon.map((p) =>
      Array.isArray(p)
        ? { lat: toNum(p[0]), lng: toNum(p[1]) }
        : { lat: toNum(p?.lat), lng: toNum(p?.lng) },
    );
  }
  points = points.filter((p) => isNum(p.lat) && isNum(p.lng));
  const first = points[0];
  const last = points[points.length - 1];
  if (points.length > 1 && first.lat === last.lat && first.lng === last.lng) points.pop();
  return points.length >= 3 ? points : null;
}

export function hasPosition(p) {
  return isNum(toNum(p?.lat)) && isNum(toNum(p?.lng));
}

export function centroidOf(points) {
  const ok = (points || []).filter((p) => isNum(p?.lat) && isNum(p?.lng));
  if (!ok.length) return null;
  return {
    lat: ok.reduce((s, p) => s + p.lat, 0) / ok.length,
    lng: ok.reduce((s, p) => s + p.lng, 0) / ok.length,
  };
}

/* ─── One shape for every place ──────────────────────────────────────────── */

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
    group: SITE_GROUP_OF_STATUS[status] || groupOfType(type),
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

function inGroup(p, group) {
  if (group === 'all') return !SET_ASIDE.has(p.group);
  if (group === 'risk') return Boolean(p.risk) && p.group !== 'rejected';
  return p.group === group;
}

/**
 * "All" means every confirmed place. Suggestions waiting for an answer can run
 * into the hundreds, so they live only under "To review" and never crowd it;
 * places answered "not a place" wait under their own chip, to be undone.
 */
export function filterPlaces(places, { group = 'all', query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return places.filter((p) => {
    if (!inGroup(p, group)) return false;
    if (!q) return true;
    return [p.name, p.subtitle, placeTypeLabel(p.type)]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });
}

export function countByGroup(places) {
  const counts = { all: 0, risk: 0 };
  for (const p of places) {
    counts[p.group] = (counts[p.group] || 0) + 1;
    if (!SET_ASIDE.has(p.group)) counts.all += 1;
    if (inGroup(p, 'risk')) counts.risk += 1;
  }
  return counts;
}

export function placeTotals(places) {
  const confirmed = places.filter((p) => p.status === 'CONFIRMED');
  return {
    places: confirmed.length,
    warehouses: confirmed.filter((p) => p.group === 'warehouse').length,
    zones: confirmed.filter((p) => p.group === 'zone').length,
    toReview: places.filter((p) => p.status === 'PROPOSED').length,
  };
}

/* ─── Idling ─────────────────────────────────────────────────────────────── */

export function liveIdleTotals(live = []) {
  const excess = live.filter((e) => e.legitimacy === 'excess');
  return {
    count: live.length,
    excessCount: excess.length,
    rupees: live.reduce((s, e) => s + (Number(e.rupees) || 0), 0),
    excessRupees: excess.reduce((s, e) => s + (Number(e.rupees) || 0), 0),
  };
}

/** About 250 m — close enough that two idles are "the same spot". */
const IDLE_CELL_DEG = 0.0025;

/**
 * Closed idle events grouped into spots on a ~250 m grid, worst first by the
 * money burned outside any known place. A spot full of excess idling is the
 * one a manager should either fix or declare as a place.
 */
export function clusterIdleEvents(events = [], { cellDeg = IDLE_CELL_DEG } = {}) {
  const cells = new Map();
  for (const e of events) {
    const lat = toNum(e.lat);
    const lng = toNum(e.lng);
    if (!isNum(lat) || !isNum(lng)) continue;
    const key = `${Math.round(lat / cellDeg)}:${Math.round(lng / cellDeg)}`;
    let c = cells.get(key);
    if (!c) {
      c = { key, latSum: 0, lngSum: 0, events: 0, minutes: 0, rupees: 0, excessRupees: 0 };
      c.trucks = new Set();
      c.zoneNames = new Set();
      c.lastAt = null;
      cells.set(key, c);
    }
    const rupees = Number(e.rupees) || 0;
    c.latSum += lat;
    c.lngSum += lng;
    c.events += 1;
    c.minutes += Number(e.durationMin) || 0;
    c.rupees += rupees;
    if (e.legitimacy === 'excess') c.excessRupees += rupees;
    if (e.registrationNumber) c.trucks.add(e.registrationNumber);
    if (e.zoneName) c.zoneNames.add(e.zoneName);
    const at = e.endAt || e.startAt;
    if (at && (!c.lastAt || at > c.lastAt)) c.lastAt = at;
  }
  return [...cells.values()]
    .map((c) => ({
      id: `idle:${c.key}`,
      lat: c.latSum / c.events,
      lng: c.lngSum / c.events,
      events: c.events,
      hours: c.minutes / 60,
      rupees: c.rupees,
      excessRupees: c.excessRupees,
      excessShare: c.rupees > 0 ? c.excessRupees / c.rupees : 0,
      trucks: [...c.trucks].sort(),
      zoneNames: [...c.zoneNames],
      lastAt: c.lastAt,
    }))
    .sort((a, b) => b.excessRupees - a.excessRupees || b.rupees - a.rupees);
}

export function idleHistoryTotals(events = []) {
  return events.reduce(
    (t, e) => {
      const rupees = Number(e.rupees) || 0;
      t.events += 1;
      t.hours += (Number(e.durationMin) || 0) / 60;
      t.rupees += rupees;
      if (e.legitimacy === 'excess') t.excessRupees += rupees;
      return t;
    },
    { events: 0, hours: 0, rupees: 0, excessRupees: 0 },
  );
}

/* ─── Unexplained stops ──────────────────────────────────────────────────── */

/** Last week's unexplained stops, one entry per place (its site, else a ~100 m cell), worst first. */
export function stopGroupsOf(breaks = []) {
  return groupBreaks(breaks)
    .filter((g) => isNum(g.lat) && isNum(g.lng))
    .map((g) => ({ ...g, id: `stop:${g.key}` }));
}

export function stopTotals(groups = []) {
  const trucks = new Set();
  let stops = 0;
  let minutes = 0;
  for (const g of groups) {
    stops += g.stops.length;
    minutes += g.minutes;
    g.trucks.forEach((t) => trucks.add(t));
  }
  return { places: groups.length, stops, minutes, trucks: trucks.size };
}

/* ─── Fuel risk ──────────────────────────────────────────────────────────── */

export function fromHotspot(h) {
  const provenance = provenanceOf(h);
  return {
    id: `hotspot:${h._id}`,
    sourceId: String(h._id),
    name: h.name || 'Fuel risk hotspot',
    lat: toNum(h.centerLat),
    lng: toNum(h.centerLng),
    radiusM: Number(h.radiusM) || 500,
    provenance,
    category: h.category || 'THEFT',
    active: h.active !== false,
    incidentCount: Number(h.incidentCount) || 0,
    lastIncidentAt: h.lastIncidentAt || null,
    readOnly: provenance === 'network',
    raw: h,
  };
}

export const PROVENANCE_LABEL = {
  'own-manual': 'Marked by your team',
  'own-learned': 'Learned from your fleet',
  network: 'Seen across the network',
};

export function drainCellsOf(map) {
  return (map?.buckets || [])
    .filter((b) => isNum(toNum(b.centerLat)) && isNum(toNum(b.centerLng)))
    .map((b) => ({
      id: `drain:${b.cell}`,
      lat: Number(b.centerLat),
      lng: Number(b.centerLng),
      events: Number(b.count) || 0,
      litres: Number(b.totalLitres) || 0,
      rupees: Number(b.estimatedInr) || 0,
      vehicles: b.vehicles || [],
    }));
}

export function fuelTotals(hotspots = [], cells = []) {
  return {
    active: hotspots.filter((h) => h.active && h.provenance !== 'network').length,
    network: hotspots.filter((h) => h.active && h.provenance === 'network').length,
    drainRupees: cells.reduce((s, c) => s + c.rupees, 0),
    drainEvents: cells.reduce((s, c) => s + c.events, 0),
  };
}

/* ─── Editor (add / edit a place) ────────────────────────────────────────── */

export const KIND_META = {
  WAREHOUSE: {
    label: 'Warehouse / yard',
    hint: 'Trips start and end here, and vehicles can be based here.',
    minRadius: 100,
    maxRadius: 50000,
    defaultRadius: 300,
    polygon: false,
  },
  ZONE: {
    label: 'Geofence zone',
    hint: 'Get an alert when a truck enters or leaves. Idling inside counts as legit.',
    minRadius: 50,
    maxRadius: 50000,
    defaultRadius: 500,
    polygon: true,
  },
  HOTSPOT: {
    label: 'Fuel risk hotspot',
    hint: 'Refuels and stops here are flagged for a fuel review.',
    minRadius: 50,
    maxRadius: 50000,
    defaultRadius: 500,
    polygon: false,
  },
};

export function newDraft(kind, seed = {}) {
  const meta = KIND_META[kind];
  return {
    mode: 'create',
    kind,
    sourceId: null,
    shape: 'circle',
    name: seed.name || '',
    code: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    center: seed.center || null,
    radiusM: meta.defaultRadius,
    polygon: [],
    polygonDone: false,
    alertOnEntry: true,
    alertOnExit: false,
  };
}

/** An editable draft for a place that already exists, or null if it can't be edited here. */
export function draftFromPlace(place) {
  if (!place || place.readOnly) return null;
  const center = { lat: place.lat, lng: place.lng };
  if (place.source === 'warehouse') {
    const w = place.raw;
    return {
      ...newDraft('WAREHOUSE'),
      mode: 'edit',
      sourceId: place.sourceId,
      name: w.name || '',
      code: w.code || '',
      address: w.address || '',
      city: w.city || '',
      state: w.state || '',
      pincode: w.pincode || '',
      center,
      radiusM: Number(w.geofenceRadiusM) || KIND_META.WAREHOUSE.defaultRadius,
    };
  }
  if (place.source === 'zone') {
    return {
      ...newDraft('ZONE'),
      mode: 'edit',
      sourceId: place.sourceId,
      name: place.name,
      center,
      shape: place.polygon ? 'polygon' : 'circle',
      radiusM: place.radiusM || KIND_META.ZONE.defaultRadius,
      polygon: place.polygon || [],
      polygonDone: Boolean(place.polygon),
      alertOnEntry: place.alerts.entry,
      alertOnExit: place.alerts.exit,
    };
  }
  if (place.provenance && place.provenance !== 'network') {
    return {
      ...newDraft('HOTSPOT'),
      mode: 'edit',
      sourceId: place.sourceId,
      name: place.name,
      center,
      radiusM: place.radiusM,
    };
  }
  return null;
}

const inIndia = (p) => p && p.lat >= 6 && p.lat <= 38 && p.lng >= 68 && p.lng <= 98;

export function validateDraft(d) {
  const meta = KIND_META[d.kind];
  const errors = {};
  if (!d.name.trim()) errors.name = 'Give the place a name';
  else if (d.name.trim().length > (d.kind === 'HOTSPOT' ? 120 : 200))
    errors.name = 'Name is too long';
  if (d.kind === 'WAREHOUSE' && d.code.trim().length > 20)
    errors.code = 'Code is at most 20 characters';

  if (d.shape === 'polygon') {
    if (d.polygon.length < 3) errors.shape = 'Click at least 3 points on the map';
    else if (!d.polygonDone) errors.shape = 'Finish the outline first';
  } else {
    const r = Number(d.radiusM);
    if (!d.center) errors.shape = 'Click the map or search to drop a pin';
    else if (!inIndia(d.center)) errors.shape = 'The pin must be inside India';
    if (!Number.isFinite(r) || r < meta.minRadius || r > meta.maxRadius) {
      errors.radiusM = `Radius must be ${meta.minRadius.toLocaleString('en-IN')}–${meta.maxRadius.toLocaleString('en-IN')} m`;
    }
  }
  return errors;
}

/** The request body each store's own API expects. */
export function payloadFor(d) {
  const radius = Math.round(Number(d.radiusM));
  if (d.kind === 'WAREHOUSE') {
    return {
      name: d.name.trim(),
      code: d.code.trim().toUpperCase(),
      address: d.address.trim(),
      city: d.city.trim(),
      state: d.state.trim(),
      pincode: d.pincode.trim(),
      lat: d.center.lat,
      lng: d.center.lng,
      geofenceRadiusM: radius,
    };
  }
  if (d.kind === 'ZONE') {
    const polygon = d.shape === 'polygon';
    const at = polygon ? centroidOf(d.polygon) : d.center;
    return {
      name: d.name.trim(),
      lat: at.lat,
      lng: at.lng,
      radiusMetres: polygon ? 0 : radius,
      geofenceType: polygon ? 'polygon' : 'circular',
      polygonPath: polygon ? d.polygon : [],
      alertOnEntry: d.alertOnEntry,
      alertOnExit: d.alertOnExit,
      cooldownMinutes: 0,
    };
  }
  return {
    name: d.name.trim(),
    centerLat: d.center.lat,
    centerLng: d.center.lng,
    radiusM: radius,
  };
}

/** Address fields from a Google geocoder result, for prefilling a warehouse. */
export function addressParts(result) {
  const parts = result?.address_components || [];
  const pick = (type) => parts.find((p) => (p.types || []).includes(type))?.long_name || '';
  return {
    address: result?.formatted_address || '',
    city:
      pick('locality') ||
      pick('administrative_area_level_3') ||
      pick('administrative_area_level_2'),
    state: pick('administrative_area_level_1'),
    pincode: pick('postal_code'),
  };
}

/* ─── Formatting ─────────────────────────────────────────────────────────── */

export function radiusLabel(m) {
  if (!isNum(m) || m <= 0) return '—';
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

export function durationLabel(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

export function hoursLabel(hours) {
  const h = Number(hours) || 0;
  return h < 10 ? `${h.toFixed(1)} h` : `${Math.round(h).toLocaleString('en-IN')} h`;
}

export function coordsLabel(lat, lng) {
  return isNum(lat) && isNum(lng) ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '—';
}
