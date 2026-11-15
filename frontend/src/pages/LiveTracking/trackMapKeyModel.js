/**
 * What the Places & routes map key lists. Pure: the page passes what is drawn,
 * the key names only those things, so it never explains a layer that is off.
 */
const MAX_TYPES = 8;

/** Place types actually on the map, busiest first, capped so the key stays one line. */
export function keyPlaceTypes(places = []) {
  const counts = new Map();
  for (const p of places) {
    const type = p?.type || 'UNKNOWN';
    counts.set(type, (counts.get(type) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, MAX_TYPES)
    .map(([type]) => type);
}

/** Line styles present among drawn routes (RouteLayer: driven solid, engine dashed, none dotted). */
export function keyRouteSources(lines = []) {
  const present = new Set(lines.map((l) => l?.source || 'NONE'));
  return ['DRIVEN', 'ENGINE', 'NONE'].filter((s) => present.has(s));
}
