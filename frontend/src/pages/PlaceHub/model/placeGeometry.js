export const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
/** Number() turns null and '' into 0 — a real coordinate — so those become NaN here. */
export const toNum = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));

/**
 * One ring as [{lat, lng}] — GeoJSON [lng, lat] pairs or legacy points.
 * The closing point is dropped, and fewer than 3 points is no ring at all.
 */
function ringPoints(ring, geoOrder) {
  if (!Array.isArray(ring)) return null;
  const points = ring
    .map((p) => {
      if (Array.isArray(p)) {
        return geoOrder
          ? { lat: toNum(p[1]), lng: toNum(p[0]) }
          : { lat: toNum(p[0]), lng: toNum(p[1]) };
      }
      return { lat: toNum(p?.lat), lng: toNum(p?.lng) };
    })
    .filter((p) => isNum(p.lat) && isNum(p.lng));
  const first = points[0];
  const last = points[points.length - 1];
  if (points.length > 1 && first.lat === last.lat && first.lng === last.lng) points.pop();
  return points.length >= 3 ? points : null;
}

/** One part as rings: the outer ring first, the holes after it. */
function partOf(rings, geoOrder) {
  const out = [];
  for (const raw of rings || []) {
    const ring = ringPoints(raw, geoOrder);
    if (ring) out.push(ring);
  }
  return out.length ? out : null;
}

/**
 * The area of a place as parts: each part is a list of rings — the outer ring
 * first, the holes after it — every ring [{lat, lng}].
 *
 * Takes GeoJSON {type: 'Polygon'|'MultiPolygon', coordinates} in [lng, lat],
 * old OrgSite [[lat, lng]] pairs and GeofenceZone's [{lat, lng}].
 * Null when there is no usable area.
 */
export function partsOf(polygon) {
  if (!polygon) return null;
  const parts = [];
  if (Array.isArray(polygon)) {
    const first = polygon[0];
    const firstPair = Array.isArray(first) ? first[0] : null;
    if (!Array.isArray(first) || typeof firstPair === 'number') {
      // old points: [[lat, lng]] or [{lat, lng}]
      const part = partOf([polygon], false);
      if (part) parts.push(part);
    } else if (Array.isArray(firstPair[0])) {
      // raw MultiPolygon coordinates
      for (const poly of polygon) {
        const part = partOf(poly, true);
        if (part) parts.push(part);
      }
    } else {
      // raw Polygon coordinates
      const part = partOf(polygon, true);
      if (part) parts.push(part);
    }
  } else if (typeof polygon === 'object' && Array.isArray(polygon.coordinates)) {
    const c = polygon.coordinates;
    const multi =
      polygon.type === 'MultiPolygon' ||
      (Array.isArray(c[0]) && Array.isArray(c[0][0]) && Array.isArray(c[0][0][0]));
    for (const poly of multi ? c : [c]) {
      const part = partOf(poly, true);
      if (part) parts.push(part);
    }
  }
  return parts.length ? parts : null;
}

/**
 * The outer ring of the largest part of an area — the shape the map draws and
 * the drawer edits. Null when there is no usable area.
 */
export function ringOf(polygon) {
  const parts = partsOf(polygon);
  if (!parts) return null;
  let best = null;
  for (const part of parts) {
    const outer = part[0];
    if (!outer) continue;
    if (!best || outer.length > best.length) best = outer;
  }
  return best;
}

/** Half the Earth's size — good enough for a yard-sized polygon. */
const EARTH_R = 6371008.8;

/** The area of one ring in square metres, flattened around its middle. */
function ringAreaM2(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return 0;
  const meanLat = ring.reduce((sum, p) => sum + p.lat, 0) / ring.length;
  const kx = (Math.PI * EARTH_R * Math.cos((meanLat * Math.PI) / 180)) / 180;
  const ky = (Math.PI * EARTH_R) / 180;
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    sum += p.lng * kx * (q.lat * ky) - q.lng * kx * (p.lat * ky);
  }
  return Math.abs(sum) / 2;
}

/**
 * The area covered by parts — each a list of rings, the outer ring first —
 * in square metres. Null when there is no usable area.
 */
export function areaM2Of(parts) {
  if (!Array.isArray(parts) || !parts.length) return null;
  let total = 0;
  for (const part of parts) {
    const rings = Array.isArray(part) ? part : [];
    if (!rings.length) continue;
    let holes = 0;
    for (const hole of rings.slice(1)) holes += ringAreaM2(hole);
    total += Math.max(0, ringAreaM2(rings[0]) - holes);
  }
  return total > 0 ? total : null;
}

export function hasPosition(p) {
  return isNum(toNum(p?.lat)) && isNum(toNum(p?.lng));
}

export function centroidOf(points) {
  const ok = (points || []).filter((p) => isNum(p?.lat) && isNum(p?.lng));
  if (!ok.length) return null;
  return {
    lat: ok.reduce((s, p) => s + p.lat, 0) / ok.length,
    lng: ok.reduce((s, p) => s + p.lng, 0) / ok.length,
  };
}
