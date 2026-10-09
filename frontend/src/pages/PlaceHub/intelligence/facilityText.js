/**
 * Plain-language text for a facility view (what trip detection sees at a
 * place). Pure — used by the place detail, the facilities list and tests.
 */

export const ROLE_LABEL = { PICKUP: 'Pickup', DROP: 'Drop' };

const BIN_TEXT = {
  fleet: {
    HIGH: 'trucks often load/unload here',
    MID: 'trucks sometimes load/unload here',
    LOW: 'trucks rarely load/unload here',
    THIN: 'too few stops to tell',
  },
  poi: {
    PLANT: 'the map shows a plant or factory here',
    INDUSTRIAL: 'the map shows an industrial area here',
    LOGISTICS: 'the map shows a warehouse, siding or market here',
    ROADSIDE: 'the map shows a pump, dhaba or workshop here',
    NONE: 'nothing on the map explains it',
    UNSWEPT: 'the map has not been checked here yet',
  },
  register: {
    MAPPED: 'your register’s plant/town names point here',
    NOT_MAPPED: 'your register does not point here',
    NA: null,
  },
};

export function pct(p) {
  return p == null ? '—' : `${Math.round(p * 100)}%`;
}

/** "Pickup (learned, 91%)" / "Pickup & drop (your answer)" / "No role". */
export function roleText(f) {
  if (!f) return null;
  const roles = (f.roles || []).map((r) => ROLE_LABEL[r] || r);
  if (!roles.length) return 'Not a pickup or drop';
  const how =
    f.typeSource === 'MANAGER'
      ? 'your answer'
      : `learned, ${pct(Math.max(...(f.roles || []).map((r) => (r === 'PICKUP' ? f.pPickup : f.pDrop) ?? 0)))}`;
  const text = roles.join(' & ').toLowerCase();
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} (${how})`;
}

/** The evidence behind the pickup call, as short sentences. */
export function evidenceLines(f, role = 'PICKUP') {
  const bins = f?.why?.bins?.[role];
  if (!bins) return [];
  return ['fleet', 'poi', 'register']
    .map((k) => (bins[k] ? BIN_TEXT[k][bins[k]] : null))
    .filter(Boolean);
}

export function poiText(poi) {
  const m = poi?.match;
  if (!m) return null;
  const where = m.inside ? 'inside' : `${m.distanceM} m away`;
  const src = m.source === 'GOOGLE_PLACES' ? 'Google' : 'OpenStreetMap';
  return `${m.name || m.category?.toLowerCase().replace(/_/g, ' ')} — ${where} (${src})`;
}

/** Name a drop: the place, else its market area, else what we know. */
export function dropLabel(drop) {
  if (!drop) return '—';
  if (drop.name) return drop.name;
  if (drop.areaName) return `${drop.areaName} area`;
  return drop.source === 'UNKNOWN' ? 'drop not found' : 'unnamed place';
}
