/**
 * Tone helpers for the redesign.
 *
 * A tone is one of the four Severity values: good, info, watch, act. Every
 * tone resolves to a tint background, an ink colour for text on that tint,
 * and an icon colour — so nothing on screen is "dead" grey by accident.
 */

const TONE = {
  good: {
    bg: 'bg-[var(--rd-good-tint)]',
    ink: 'text-[var(--rd-good-ink)]',
    solid: 'bg-[var(--rd-good)]',
    border: 'border-[var(--rd-good)]',
    label: 'Good',
  },
  info: {
    bg: 'bg-[var(--rd-info-tint)]',
    ink: 'text-[var(--rd-info-ink)]',
    solid: 'bg-[var(--rd-info)]',
    border: 'border-[var(--rd-info)]',
    label: 'Info',
  },
  watch: {
    bg: 'bg-[var(--rd-watch-tint)]',
    ink: 'text-[var(--rd-watch-ink)]',
    solid: 'bg-[var(--rd-watch)]',
    border: 'border-[var(--rd-watch)]',
    label: 'Watch',
  },
  act: {
    bg: 'bg-[var(--rd-act-tint)]',
    ink: 'text-[var(--rd-act-ink)]',
    solid: 'bg-[var(--rd-act)]',
    border: 'border-[var(--rd-act)]',
    label: 'Needs you',
  },
};

/** The neutral tone, for facts that need no judgement. */
const NEUTRAL = {
  bg: 'bg-[var(--rd-card-2)]',
  ink: 'text-[var(--rd-ink-2)]',
  solid: 'bg-[var(--rd-ink-3)]',
  border: 'border-[var(--rd-line-strong)]',
  label: 'Info',
};

/** Tone lookup that never returns undefined. */
export function toneStyles(tone) {
  return TONE[tone] || NEUTRAL;
}

/** The word a tone is called in the owner's language. */
export function toneLabel(tone) {
  return toneStyles(tone).label;
}

/**
 * The vehicle status colours, used by map markers, legend dots and status
 * pills. Kept in one place so the marker, the legend and the panel can never
 * show the same truck in two colours.
 */
const STATUS = {
  MOVING: 'var(--rd-moving)',
  IDLING: 'var(--rd-idling)',
  STOPPED: 'var(--rd-stopped)',
  OFFLINE: 'var(--rd-offline)',
};

/** The CSS colour for a vehicle status, or the offline grey as a fallback. */
export function statusColor(status) {
  return STATUS[String(status || '').toUpperCase()] || STATUS.OFFLINE;
}

/** The place-layer colours, used by legend dots and place pins. */
const PLACE_LAYER = {
  plants: 'var(--rd-pl-plant)',
  sites: 'var(--rd-pl-site)',
  pumps: 'var(--rd-pl-pump)',
  dhabas: 'var(--rd-pl-dhaba)',
  hospitals: 'var(--rd-pl-hospital)',
  police: 'var(--rd-pl-police)',
  workshops: 'var(--rd-pl-workshop)',
  dealers: 'var(--rd-pl-dealer)',
  tyres: 'var(--rd-pl-tyre)',
  parking: 'var(--rd-pl-parking)',
  tolls: 'var(--rd-pl-toll)',
  weighbridges: 'var(--rd-pl-weighbridge)',
  schools: 'var(--rd-pl-school)',
  atms: 'var(--rd-pl-atm)',
  liquor: 'var(--rd-pl-liquor)',
};

/** The CSS colour for a place layer, or the site grey as a fallback. */
export function placeLayerColor(layer) {
  return PLACE_LAYER[layer] || PLACE_LAYER.sites;
}

/**
 * The colour of a place, or the site grey as a fallback.
 */
export function placeCategoryColor(category) {
  const key = String(category || '').toLowerCase();
  if (key.includes('plant')) return PLACE_LAYER.plants;
  if (key.includes('pump') || key.includes('fuel')) return PLACE_LAYER.pumps;
  if (key.includes('dhaba') || key.includes('food')) return PLACE_LAYER.dhabas;
  if (key.includes('hospital') || key.includes('medical')) return PLACE_LAYER.hospitals;
  if (key.includes('police')) return PLACE_LAYER.police;
  if (key.includes('workshop') || key.includes('service')) return PLACE_LAYER.workshops;
  if (key.includes('dealer')) return PLACE_LAYER.dealers;
  if (key.includes('tyre')) return PLACE_LAYER.tyres;
  if (key.includes('parking')) return PLACE_LAYER.parking;
  if (key.includes('toll')) return PLACE_LAYER.tolls;
  if (key.includes('weigh')) return PLACE_LAYER.weighbridges;
  if (key.includes('school')) return PLACE_LAYER.schools;
  if (key.includes('atm')) return PLACE_LAYER.atms;
  if (key.includes('liquor')) return PLACE_LAYER.liquor;
  return PLACE_LAYER.sites;
}

/**
 * A design token's value, read from the document.
 *
 * Some drawing libraries (Leaflet's SVG paths, for one) take a colour
 * string rather than a class name, so they cannot use `var(--rd-…)` in a
 * style attribute. Reading the token keeps the stylesheet the single
 * source of truth, and the fallback keeps a server render or a missing
 * token from producing an invisible line.
 */
export function cssToken(name, fallback) {
  if (typeof window === 'undefined' || !window.getComputedStyle) return fallback;
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name);
  return value && value.trim() ? value.trim() : fallback;
}
