/**
 * Pure presentation helpers for the Place Intelligence page — no React, so
 * they are unit-tested directly.
 */

export const SITE_TYPE_LABEL = {
  FUEL_PUMP: 'Fuel pump',
  LOADING: 'Loading site',
  UNLOADING: 'Unloading site',
  PLANT: 'Plant',
  WAREHOUSE: 'Warehouse',
  YARD: 'Own yard',
  PARKING: 'Parking',
  VEHICLE_HABIT: 'One truck’s habit',
  WORKSHOP: 'Workshop',
  SERVICE: 'Service point',
  TOLL: 'Toll',
  CHECKPOST: 'Checkpost',
  DHABA: 'Dhaba / rest stop',
  UNEXPLAINED: 'Unexplained',
  UNKNOWN: 'Unknown',
};

/** Types a manager can pick when answering. */
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
  QUEUE: 'Queue / traffic',
  UNEXPLAINED: 'Unexplained',
};

export const EVIDENCE_LABEL = {
  CONFIRMED: 'Confirmed by two kinds of evidence',
  LIKELY: 'Likely',
  CONFLICT: 'Evidence disagrees',
  UNCORROBORATED: 'One weak signal',
  INSUFFICIENT_DATA: 'Too few visits',
};

export const REASON_LABEL = {
  PROPOSED: 'Needs an answer',
  CONFLICT: 'Evidence disagrees',
  AUDIT: 'Random check',
};

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
  if (!e || !e.siteType || e.siteType === 'UNKNOWN') return null;
  if (!['CONFIRMED', 'LIKELY', 'CONFLICT'].includes(e.evidenceLevel)) return null;
  return { siteType: e.siteType, confidence: confidencePct(e.confidence), level: e.evidenceLevel };
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

/** A typed ApiError that carries the trips a warehouse change would re-anchor. */
export function isImpactGate(err) {
  return err?.status === 409 && Boolean(err?.body?.impact);
}

/** The best message a failed request carries, for a toast or empty state. */
export function messageOf(err, fallback) {
  return err?.displayMessage || fallback;
}
