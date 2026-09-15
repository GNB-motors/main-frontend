import apiClient from '../utils/axiosConfig';

/**
 * searchService — global command-palette search over FMS entities.
 * Backed by GET /api/search?q= returning { results: [{ type, id, label, sub, url }] }
 * over vehicles, drivers, trips and routes. Parties are intentionally absent
 * (the only party model is ERP, out of FMS scope).
 */

export const TYPE_ORDER = ['VEHICLE', 'DRIVER', 'TRIP', 'ROUTE'];

const VALID_TYPES = new Set(TYPE_ORDER);
const MAX_RESULTS = 40;

/** Pure: keep only well-formed results, cap the total, stable-sort by type group. */
export function normaliseResults(raw) {
  if (!Array.isArray(raw)) return [];
  const clean = raw.filter(
    (r) => r && VALID_TYPES.has(r.type) && typeof r.label === 'string' && r.label.trim() !== '' && typeof r.url === 'string' && r.url.startsWith('/'),
  );
  const rank = new Map(TYPE_ORDER.map((t, i) => [t, i]));
  // Array.prototype.sort is stable (spec-guaranteed): original order is kept
  // within a type group, so no explicit tie-breaker index is needed.
  return clean
    .slice(0, MAX_RESULTS)
    .sort((a, b) => (rank.get(a.type) ?? 99) - (rank.get(b.type) ?? 99));
}

export async function searchAll(q, { signal } = {}) {
  const response = await apiClient.get('/api/search', { params: { q }, signal });
  return normaliseResults(response.data?.data?.results ?? response.data?.results);
}
