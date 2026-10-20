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
