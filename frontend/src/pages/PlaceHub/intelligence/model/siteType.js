import { SITE_TYPE_LABEL } from './siteVocabulary.js';

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
  // The nightly label step settles this against the neighbours and the org's
  // learned confidence floor; until it has run, read the raw fields as before.
  const d = site.display;
  if (d?.computedAt) {
    if (MEANINGFUL(d.type)) return { type: d.type, source: d.source };
    if (d.source === 'floor' || d.source === 'neighbour')
      return { type: 'UNKNOWN', source: d.source, leaning: d.leaning || null };
    return { type: 'UNKNOWN', source: 'none' };
  }
  if (site.status === 'CONFIRMED' && MEANINGFUL(site.siteType))
    return { type: site.siteType, source: 'you' };
  const e = site.engine || {};
  if (MEANINGFUL(e.siteType)) return { type: e.siteType, source: 'engine' };
  if (MEANINGFUL(e.leaning)) return { type: e.leaning, source: 'leaning' };
  if (MEANINGFUL(site.siteType)) return { type: site.siteType, source: 'legacy' };
  return { type: 'UNKNOWN', source: 'none' };
}
