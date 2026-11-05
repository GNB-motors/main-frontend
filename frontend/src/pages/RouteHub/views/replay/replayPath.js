/**
 * The replay's path on the map: the stretches the truck drove, and the stretches
 * where the GPS went quiet. A gap is never a road, so it is drawn dashed.
 */

/** The whole trip's path: solid indigo. */
export const DRIVEN = { color: '#4f46e5', weight: 4, opacity: 0.45, lineCap: 'round' };
/** The part already driven: the same line, at full strength. */
export const DRIVEN_DONE = { color: '#4f46e5', weight: 4, opacity: 1, lineCap: 'round' };
/** Where the signal went: the path there is a guess, so it is dashed. */
export const GAP = { color: '#94a3b8', weight: 3, opacity: 0.9, dashArray: '8 8', lineCap: 'round' };

/** The gap types where the vehicle's path is unknown: it drove, but nothing reported. */
const GAP_TYPES = new Set(['moving', 'inter_trip']);

/**
 * The raw GPS trail in pieces: the driven stretches and the gaps between them.
 * Each piece carries the fix indices it covers, so the replay can cut it at the truck.
 */
export function pathPieces(fixes) {
  const list = fixes || [];
  const pieces = [];
  let current = null;
  list.forEach((f, i) => {
    if (i === 0) {
      current = { gap: false, path: [f.ll], from: 0, to: 0 };
      pieces.push(current);
      return;
    }
    const gap = GAP_TYPES.has(f.gapType);
    if (!current || current.gap !== gap) {
      current = { gap, path: [list[i - 1].ll, f.ll], from: i - 1, to: i };
      pieces.push(current);
      return;
    }
    current.path.push(f.ll);
    current.to = i;
  });
  return pieces;
}

/**
 * The pieces driven up to a fix, the last one cut at the truck's position.
 * A gap is left out: we never draw a road we did not see.
 */
export function travelledPieces(pieces, upto, ll) {
  const out = [];
  (pieces || []).forEach((p) => {
    if (p.gap || p.from >= upto) return;
    if (p.to < upto) {
      out.push(p.path);
      return;
    }
    out.push([...p.path.slice(0, upto - p.from), ll]);
  });
  return out;
}

/** A matched road layer's style: the gap bridges are dashed, the rest is the driven path. */
export function layerStyle(layer) {
  return layer.kind === 'INFERRED' ? GAP : DRIVEN;
}
