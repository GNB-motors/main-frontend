/**
 * Pure presentation helpers for the Place Intelligence page — no React, so
 * they are unit-tested directly.
 */

export const SITE_TYPE_LABEL = {
  FUEL_PUMP: 'Fuel pump',
  LOADING: 'Loading point',
  UNLOADING: 'Unloading point',
  PLANT: 'Plant',
  WAREHOUSE: 'Warehouse',
  YARD: 'Own yard',
  PARKING: 'Parking',
  VEHICLE_HABIT: 'A driver’s regular spot',
  WORKSHOP: 'Workshop',
  SERVICE: 'Service point',
  TOLL: 'Toll plaza',
  CHECKPOST: 'Checkpost',
  DHABA: 'Dhaba / rest stop',
  UNEXPLAINED: 'Unexplained',
  UNKNOWN: 'Unknown',
};

/** Types a manager can answer with, most common first. */
export const ANSWER_TYPES = [
  'FUEL_PUMP',
  'LOADING',
  'UNLOADING',
  'PLANT',
  'WAREHOUSE',
  'YARD',
  'PARKING',
  'WORKSHOP',
  'DHABA',
  'TOLL',
  'CHECKPOST',
];

export const PURPOSE_LABEL = {
  FUEL: 'Refuelling',
  LOAD: 'Loading',
  UNLOAD: 'Unloading',
  REST: 'Rest / meal',
  OVERNIGHT: 'Overnight',
  SERVICE: 'Service / repair',
  TOLL: 'Toll / checkpost',
  QUEUE: 'Waiting in queue',
  UNEXPLAINED: 'Unexplained',
};

/** Colours for the "what trucks do here" bar — one per purpose. */
export const PURPOSE_COLOR = {
  FUEL: '#d97706',
  LOAD: '#2563eb',
  UNLOAD: '#7c3aed',
  REST: '#15803d',
  OVERNIGHT: '#334155',
  SERVICE: '#be123c',
  TOLL: '#0891b2',
  QUEUE: '#94a3b8',
  UNEXPLAINED: '#d4d4d8',
};

/** How far to trust the engine, in words a manager uses. */
export const EVIDENCE_LABEL = {
  CONFIRMED: 'Sure — two kinds of proof agree',
  LIKELY: 'Likely',
  CONFLICT: 'The evidence disagrees',
  UNCORROBORATED: 'Only one weak clue so far',
  INSUFFICIENT_DATA: 'Too few visits to say',
};

export const REASON_LABEL = {
  PROPOSED: 'Needs an answer',
  CONFLICT: 'Evidence disagrees',
  AUDIT: 'Spot check',
};

const MEANINGFUL = (t) => Boolean(t) && t !== 'UNKNOWN' && t !== 'UNEXPLAINED';

/** "a fuel pump", "an unloading point" — the label lower-cased with its article. */
export function aType(t) {
  const l = typeLabel(t).toLowerCase();
  return `${/^[aeiou]/.test(l) ? 'an' : 'a'} ${l}`;
}

export function typeLabel(t) {
  return SITE_TYPE_LABEL[t] || (t ? String(t).replace(/_/g, ' ').toLowerCase() : 'Unknown');
}

/** A leg endpoint: the site's own name, or its type when it has none. */
export function endpointLabel(v) {
  if (!v) return '—';
  return SITE_TYPE_LABEL[v] ? SITE_TYPE_LABEL[v] : v;
}

export function confidencePct(c) {
  if (c == null || !Number.isFinite(c)) return null;
  return Math.round(c * 100);
}

/** The engine's suggestion, only when it is more than a guess. */
export function suggestion(item) {
  const e = item?.site?.engine;
  if (!e || !MEANINGFUL(e.siteType)) return null;
  if (!['CONFIRMED', 'LIKELY', 'CONFLICT'].includes(e.evidenceLevel)) return null;
  return { siteType: e.siteType, confidence: confidencePct(e.confidence), level: e.evidenceLevel };
}

/**
 * The one type to show for a place, and whose word it is. A manager's answer
 * wins; then the engine when it is sure enough to name it; then its lean;
 * then whatever the legacy source called it (a parking proposal, a workshop).
 */
export function effectiveType(site) {
  if (!site) return { type: 'UNKNOWN', source: 'none' };
  if (site.status === 'CONFIRMED' && MEANINGFUL(site.siteType))
    return { type: site.siteType, source: 'you' };
  const e = site.engine || {};
  if (MEANINGFUL(e.siteType)) return { type: e.siteType, source: 'engine' };
  if (MEANINGFUL(e.leaning)) return { type: e.leaning, source: 'leaning' };
  if (MEANINGFUL(site.siteType)) return { type: site.siteType, source: 'legacy' };
  return { type: 'UNKNOWN', source: 'none' };
}

/** Status in plain words with its reserved tone. */
export function placeState(site) {
  if (!site) return { key: 'unknown', label: '—', tone: 'neutral' };
  if (site.status === 'REJECTED') return { key: 'rejected', label: 'Not a place', tone: 'neutral' };
  const conflict = site.engine?.evidenceLevel === 'CONFLICT';
  if (site.status === 'CONFIRMED')
    return conflict
      ? { key: 'confirmed', label: 'Confirmed · data disagrees', tone: 'warn' }
      : { key: 'confirmed', label: 'Confirmed', tone: 'ok' };
  return { key: 'review', label: 'Needs your answer', tone: 'warn' };
}

export function hasRisk(site) {
  const r = site?.risk || {};
  return (r.theftIncidents || 0) + (r.unauthRefuelIncidents || 0) > 0;
}

/** A name a person can read: the given name, else what it is and where. */
export function placeTitle(site) {
  if (site?.name) return site.name;
  const { type } = effectiveType(site);
  const locality = site?.address?.locality;
  const what = type === 'UNKNOWN' ? 'Unnamed stop' : typeLabel(type);
  return locality ? `${what}, ${locality}` : what;
}

export function coordsLabel(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function placeSubtitle(site) {
  return (
    site?.address?.formatted ||
    site?.address?.locality ||
    coordsLabel(site?.centroidLat, site?.centroidLng)
  );
}

const EVIDENCE_TEXT = {
  'FUEL|G2': (n) => `Tank level rose on ${n} stop${n === 1 ? '' : 's'}`,
  'FUEL|G5': (n) => `${n} fuel bill${n === 1 ? ' was' : 's were'} logged here`,
  'LOAD|G3': (n) => `Trucks left heavier than they came ${n} time${n === 1 ? '' : 's'}`,
  'LOAD|G5': (n) => `${n} ERP trip${n === 1 ? ' was' : 's were'} loaded here`,
  'LOAD|G1': (n) => `${n} stop${n === 1 ? '' : 's'} had the length and hours of loading`,
  'UNLOAD|G3': (n) => `Trucks left lighter than they came ${n} time${n === 1 ? '' : 's'}`,
  'UNLOAD|G5': (n) => `${n} ERP trip${n === 1 ? ' was' : 's were'} delivered here`,
  'UNLOAD|G1': (n) => `${n} stop${n === 1 ? '' : 's'} had the length and hours of unloading`,
  'SERVICE|G5': (n) => `${n} service record${n === 1 ? ' points' : 's point'} here`,
  'OVERNIGHT|G1': (n) => `Trucks stayed overnight ${n} time${n === 1 ? '' : 's'}`,
  'REST|G1': (n) => `${n} stop${n === 1 ? ' was' : 's were'} meal- or rest-length breaks`,
  'QUEUE|G1': (n) => `${n} short wait${n === 1 ? '' : 's'} in a queue`,
};

/** Sensor and records are hard proof; timing patterns alone are a clue. */
const GROUP_KIND = { G1: 'pattern', G2: 'sensor', G3: 'sensor', G5: 'record', G6: 'map' };

/**
 * The engine's reasons as sentences, strongest proof first:
 * [{ id, text, kind: 'sensor'|'record'|'pattern'|'map'|'gap' }].
 */
export function evidenceLines(engine) {
  if (!engine) return [];
  const rank = { sensor: 0, record: 1, map: 2, pattern: 3 };
  const lines = (engine.evidence || [])
    .filter((e) => e && e.stops > 0)
    .map((e) => {
      const key = `${e.purpose}|${e.group}`;
      const kind = GROUP_KIND[e.group] || 'pattern';
      const text = EVIDENCE_TEXT[key]
        ? EVIDENCE_TEXT[key](e.stops)
        : e.group === 'G6'
          ? `Maps list a ${(PURPOSE_LABEL[e.purpose] || e.purpose).toLowerCase()} place here`
          : `${e.stops} stop${e.stops === 1 ? '' : 's'} looked like ${(PURPOSE_LABEL[e.purpose] || e.purpose).toLowerCase()}`;
      return { id: key, text, kind };
    })
    .sort((a, b) => rank[a.kind] - rank[b.kind]);
  const n = engine.unexplainedStops || 0;
  if (n > 0)
    lines.push({
      id: 'unexplained',
      text: `${n} stop${n === 1 ? '' : 's'} nothing explains`,
      kind: 'gap',
    });
  return lines;
}

/** Fuel-risk reports at a place as one sentence, or null when there are none. */
export function riskSentence(risk, formatDate = (d) => d) {
  const theft = risk?.theftIncidents || 0;
  const refuel = risk?.unauthRefuelIncidents || 0;
  if (!theft && !refuel) return null;
  const parts = [];
  if (theft) parts.push(`${theft} fuel theft report${theft === 1 ? '' : 's'}`);
  if (refuel) parts.push(`${refuel} unauthorised refuel${refuel === 1 ? '' : 's'}`);
  const last = risk.lastIncidentAt ? `, last on ${formatDate(risk.lastIncidentAt)}` : '';
  return `${parts.join(' and ')} here${last}. Watch fills and night halts at this spot.`;
}

/**
 * What trucks do here, as shares of stops (drops slivers under 3%). A flat
 * spread is the prior talking, not the trucks, so it is not shown at all.
 */
export function purposeShares(engine) {
  const alpha = engine?.purposeAlpha;
  if (!alpha) return [];
  const total = Object.values(alpha).reduce((s, v) => s + (Number(v) || 0), 0);
  if (!total) return [];
  const shares = Object.entries(alpha).map(([purpose, v]) => ({
    purpose,
    v: (Number(v) || 0) / total,
  }));
  if (Math.max(...shares.map((x) => x.v)) < 0.25) return [];
  return Object.entries(alpha)
    .map(([purpose, v]) => ({
      purpose,
      label: PURPOSE_LABEL[purpose] || purpose,
      share: (Number(v) || 0) / total,
    }))
    .filter((p) => p.share >= 0.03)
    .sort((a, b) => b.share - a.share);
}

/** A place's numbers, engine first, legacy fields as the fallback. */
export function placeStats(site) {
  const st = site?.engine?.stats || {};
  return {
    visits: st.visits ?? site?.visitCount ?? null,
    trucks: st.trucks ?? site?.distinctVehicleCount ?? null,
    medianDwellMin: st.medianDwellMin ?? site?.medianDwellMin ?? null,
    p90DwellMin: st.p90DwellMin ?? site?.p90DwellMin ?? null,
    firstSeenAt: st.firstSeenAt ?? site?.firstSeenAt ?? null,
    lastSeenAt: st.lastSeenAt ?? site?.lastSeenAt ?? null,
  };
}

/** The list filters, each a predicate over a site. */
export const PLACE_FILTERS = [
  { key: 'all', label: 'All', test: (s) => s.status !== 'REJECTED' },
  { key: 'confirmed', label: 'Confirmed', test: (s) => s.status === 'CONFIRMED' },
  { key: 'risk', label: 'Fuel risk', test: (s) => hasRisk(s) },
  { key: 'rejected', label: 'Not a place', test: (s) => s.status === 'REJECTED' },
];

export function filterPlaces(sites, filterKey, query) {
  const f = PLACE_FILTERS.find((x) => x.key === filterKey) || PLACE_FILTERS[0];
  const q = (query || '').trim().toLowerCase();
  return (sites || []).filter((s) => {
    if (!f.test(s)) return false;
    if (!q) return true;
    const hay = [placeTitle(s), placeSubtitle(s), typeLabel(effectiveType(s).type)]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

/**
 * Unproductive stops grouped by the place they happened at (its site, else a
 * ~100 m grid cell), worst first. One row per place is what a manager can act
 * on; 24 rows of one truck at one gate is not.
 */
export function groupBreaks(stops) {
  const groups = new Map();
  for (const s of stops || []) {
    const key = s.orgSiteId
      ? `site:${s.orgSiteId}`
      : `cell:${Number(s.lat).toFixed(3)},${Number(s.lng).toFixed(3)}`;
    if (!groups.has(key))
      groups.set(key, {
        key,
        siteId: s.orgSiteId || null,
        stops: [],
        minutes: 0,
        trucks: new Set(),
      });
    const g = groups.get(key);
    g.stops.push(s);
    g.minutes += s.dwellMinutes || 0;
    g.trucks.add(s.registrationNumber);
  }
  return [...groups.values()]
    .map((g) => ({
      key: g.key,
      siteId: g.siteId,
      stops: [...g.stops].sort((a, b) => String(b.startAt).localeCompare(String(a.startAt))),
      minutes: g.minutes,
      trucks: [...g.trucks].sort(),
      lat: g.stops.reduce((s, x) => s + x.lat, 0) / g.stops.length,
      lng: g.stops.reduce((s, x) => s + x.lng, 0) / g.stops.length,
      answered: g.stops.filter((x) => x.humanReason?.purpose).length,
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

/** Bounds that fit every point, or null when there is nothing to fit. */
export function boundsOf(points) {
  const ok = (points || []).filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng));
  if (!ok.length) return null;
  return {
    north: Math.max(...ok.map((p) => p.lat)),
    south: Math.min(...ok.map((p) => p.lat)),
    east: Math.max(...ok.map((p) => p.lng)),
    west: Math.min(...ok.map((p) => p.lng)),
  };
}

/** A bbox query for the global layer around the fleet's places (≤5° a side). */
export function bboxAround(points, padDeg = 0.3) {
  const b = boundsOf(points);
  if (!b) return null;
  const clamp = (lo, hi) => {
    const mid = (lo + hi) / 2;
    const half = Math.min((hi - lo) / 2 + padDeg, 2.45);
    return [mid - half, mid + half];
  };
  const [west, east] = clamp(b.west, b.east);
  const [south, north] = clamp(b.south, b.north);
  return [west, south, east, north].map((v) => v.toFixed(4)).join(',');
}

/** Plain-language summary of a warehouse-change impact for the confirm dialog. */
export function impactSummary(impact) {
  if (!impact) return '';
  const open = impact.openTripsAffected || 0;
  const frozen = impact.frozenTripsUnaffected || 0;
  const parts = [];
  parts.push(
    open === 0
      ? 'No open trips use this place.'
      : `${open} open trip${open === 1 ? '' : 's'} of ${impact.vehicles} vehicle${impact.vehicles === 1 ? '' : 's'} may re-anchor to this yard (km split and variance flags can change; trip cost does not).`,
  );
  if (frozen)
    parts.push(
      `${frozen} closed-tour trip${frozen === 1 ? '' : 's'} stay frozen and will not change.`,
    );
  return parts.join(' ');
}

/** "Go / wait" per reader from a shadow report's gates. */
export function gateRows(report) {
  const g = report?.gates || {};
  return [
    'places',
    'geoContext',
    'hotspots',
    'routeDeviation',
    'routeIntelligence',
    'segmentation',
  ].map((reader) => ({ reader, ready: g[reader] === true }));
}

export function minutesLabel(m) {
  if (m == null || !Number.isFinite(m)) return '—';
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function hoursLabel(minutes) {
  if (minutes == null || !Number.isFinite(minutes)) return '—';
  const h = minutes / 60;
  return h < 100 ? `${Math.round(h * 10) / 10} h` : `${Math.round(h)} h`;
}

export function kmLabel(km) {
  if (km == null || !Number.isFinite(km)) return '—';
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** A typed ApiError that carries the trips a warehouse change would re-anchor. */
export function isImpactGate(err) {
  return err?.status === 409 && Boolean(err?.body?.impact);
}

/** The best message a failed request carries, for a toast or empty state. */
export function messageOf(err, fallback) {
  return err?.displayMessage || fallback;
}
