/**
 * mapColor — colours for Google Maps.
 *
 * Google Maps draws on its own canvas and cannot read CSS variables, so a
 * colour like "var(--rd-leg-loaded)" comes out black. The token is read off
 * the document root and handed over as a plain hex instead.
 *
 * Every token has a hex fallback, taken from the same values as
 * styles/redesign/tokens.css: if the stylesheet has not loaded (or the
 * token was renamed), the map still draws the right colour rather than
 * black.
 */

const TOKEN_FALLBACKS = {
  '--rd-leg-loaded': '#2563eb',
  '--rd-leg-empty': '#64748b',
  '--rd-leg-reposition': '#0d9488',
  '--rd-leg-unknown': '#a3a3a3',
  '--rd-overspeed': '#f97316',
  '--rd-detour': '#dc2626',
  '--rd-usual-road': '#9ca3af',
};

const DEFAULT_FALLBACK = '#8a93a3';

/**
 * Turn a colour into something Google Maps can use.
 *
 * A plain colour is returned untouched. A "var(--token)" is read with
 * getComputedStyle on the document root; when the root has no value for it
 * (or the value is itself another var), the token's own hex is used.
 */
export function resolveMapColor(color, fallback = DEFAULT_FALLBACK) {
  if (typeof color !== 'string') return color;
  const text = color.trim();
  if (!text.startsWith('var(')) return text;

  const name = text.slice(4, -1).trim();
  const known = TOKEN_FALLBACKS[name] ?? fallback;

  if (typeof window === 'undefined' || !window.getComputedStyle) return known;

  let value = '';
  try {
    value = window.getComputedStyle(document.documentElement).getPropertyValue(name);
  } catch {
    return known;
  }
  const resolved = value && value.trim() ? value.trim() : '';
  if (!resolved || resolved.startsWith('var(')) return known;
  return resolved;
}

export { TOKEN_FALLBACKS, DEFAULT_FALLBACK };
export default resolveMapColor;
