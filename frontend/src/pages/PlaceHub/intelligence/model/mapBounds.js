/** Bounds that fit every point, or null when there is nothing to fit. */
export function boundsOf(points) {
  const ok = (points || []).filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng));
  if (!ok.length) return null;
  return {
    north: Math.max(...ok.map((p) => p.lat)),
    south: Math.min(...ok.map((p) => p.lat)),
    east: Math.max(...ok.map((p) => p.lng)),
    west: Math.min(...ok.map((p) => p.lng)),
  };
}

/** A bbox query for the global layer around the fleet's places (≤5° a side). */
export function bboxAround(points, padDeg = 0.3) {
  const b = boundsOf(points);
  if (!b) return null;
  const clamp = (lo, hi) => {
    const mid = (lo + hi) / 2;
    const half = Math.min((hi - lo) / 2 + padDeg, 2.45);
    return [mid - half, mid + half];
  };
  const [west, east] = clamp(b.west, b.east);
  const [south, north] = clamp(b.south, b.north);
  return [west, south, east, north].map((v) => v.toFixed(4)).join(',');
}
