export const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
/** Number() turns null and '' into 0 — a real coordinate — so those become NaN here. */
export const toNum = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));

/**
 * A polygon as [{lat, lng}] from any of the shapes the stores use: GeoJSON
 * ([lng, lat] ring — OrgSite, VehicleWarehouse), old OrgSite [[lat, lng]]
 * pairs, or GeofenceZone's [{lat, lng}]. Null when there is no usable ring.
 */
export function ringOf(polygon) {
  if (!polygon) return null;
  let points = [];
  if (Array.isArray(polygon.coordinates)) {
    const ring = polygon.coordinates[0] || [];
    points = ring.map((p) => ({ lat: toNum(p?.[1]), lng: toNum(p?.[0]) }));
  } else if (Array.isArray(polygon)) {
    points = polygon.map((p) =>
      Array.isArray(p)
        ? { lat: toNum(p[0]), lng: toNum(p[1]) }
        : { lat: toNum(p?.lat), lng: toNum(p?.lng) },
    );
  }
  points = points.filter((p) => isNum(p.lat) && isNum(p.lng));
  const first = points[0];
  const last = points[points.length - 1];
  if (points.length > 1 && first.lat === last.lat && first.lng === last.lng) points.pop();
  return points.length >= 3 ? points : null;
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
