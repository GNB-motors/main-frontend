/**
 * snapRuns — drawable runs for the display-only corridor-snap overlay.
 *
 * The snap path lists one entry per trail fix, each either 'snapped' (a fix
 * projected onto a learned corridor) or 'measured' (beyond snap tolerance,
 * kept as recorded). Drawing only the snapped fixes as one joined polyline
 * would bridge every off-corridor detour with a straight dashed line —
 * asserting corridor travel that did not happen. Splitting into runs at
 * every dropped (measured or missing) entry keeps each dashed run strictly
 * on its corridor stretch.
 *
 * @param {Array<{lat, lng, provenance}>} snapPath raw trail.snap.path
 * @returns {Array<Array<{lat, lng}>>} runs of 2+ points, ready for PolylineF
 */
export function snappedRuns(snapPath) {
  const runs = [];
  let current = [];
  for (const p of Array.isArray(snapPath) ? snapPath : []) {
    if (p && p.provenance === 'snapped') {
      current.push({ lat: p.lat, lng: p.lng });
    } else if (current.length > 0) {
      runs.push(current);
      current = [];
    }
  }
  if (current.length > 0) runs.push(current);
  return runs.filter((r) => r.length > 1);
}
