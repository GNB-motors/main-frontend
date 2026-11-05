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

/** The fleet drives inside India; a fix outside this box is a bad point, not a place. */
export const INDIA_BOX = { south: 6, north: 37, west: 68, east: 98 };

export function isInsideIndia(point) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= INDIA_BOX.south &&
    lat <= INDIA_BOX.north &&
    lng >= INDIA_BOX.west &&
    lng <= INDIA_BOX.east
  );
}

/**
 * The bounds to fit the map to, and the points left out. A stray GPS fix in
 * the ocean would otherwise drag every real place off the screen.
 */
export function planFit(points) {
  const ok = (points || [])
    .map((p) => ({ ...p, lat: Number(p?.lat), lng: Number(p?.lng) }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  const inside = ok.filter(isInsideIndia);
  return { bounds: boundsOf(inside), rejected: ok.filter((p) => !isInsideIndia(p)) };
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
