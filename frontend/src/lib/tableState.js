/**
 * Pure state helpers for the shared table chassis (PageShell / FilterBar /
 * DataTable). Kept separate so every transition is unit-testable.
 */

export const DENSITY_KEY = 'gnb.table.density';
export const DENSITIES = ['comfortable', 'compact'];

/** Sort cycle: asc → desc → none (null). Server-side sorting only. */
export function nextSort(current) {
  if (current === 'asc') return 'desc';
  if (current === 'desc') return null;
  return 'asc';
}

/**
 * Count filters the user has actively set — so the footer can say
 * "2 filters active" and never let a filter masquerade as missing data.
 * Pagination (page/limit) never counts; an empty search does not count.
 */
export function activeFilterCount(params = {}, defaults = {}) {
  const p = params ?? {};
  const d = defaults ?? {};
  return Object.entries(p).filter(([key, value]) => {
    if (key === 'page' || key === 'limit') return false;
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (key === 'q') return value.trim() !== '';
    if (key in d) {
      const def = d[key];
      if (Array.isArray(def) && Array.isArray(value)) {
        return value.length !== def.length || value.some((v, i) => v !== def[i]);
      }
      return value !== def;
    }
    return true;
  }).length;
}

/** Honest footer: "Showing 24 of 151 · 2 filters active". Never hides the total. */
export function footerSummary({ showing = 0, total = 0, activeFilters = 0 } = {}) {
  const base = `Showing ${showing} of ${total}`;
  return activeFilters > 0 ? `${base} · ${activeFilters} filter${activeFilters === 1 ? '' : 's'} active` : base;
}

/** Row density, remembered per browser. Defaults to comfortable; never throws. */
export function readDensity(storage) {
  try {
    const value = storage?.getItem(DENSITY_KEY);
    return DENSITIES.includes(value) ? value : 'comfortable';
  } catch {
    return 'comfortable';
  }
}

export function writeDensity(storage, density) {
  if (!DENSITIES.includes(density)) return false;
  try {
    storage?.setItem(DENSITY_KEY, density);
    return true;
  } catch {
    return false;
  }
}

/**
 * Column visibility: given the column config and a Set of hidden keys,
 * return the visible columns in config order. `null`/`undefined` hidden
 * means nothing is hidden.
 */
export function visibleColumns(columns = [], hidden = null) {
  if (!hidden || hidden.size === 0) return columns;
  return columns.filter((c) => !hidden.has(c.key));
}
