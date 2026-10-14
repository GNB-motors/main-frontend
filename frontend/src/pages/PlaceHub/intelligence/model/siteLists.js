import { effectiveType, typeLabel } from './siteType.js';
import { hasRisk, placeSubtitle, placeTitle } from './siteSummary.js';

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
