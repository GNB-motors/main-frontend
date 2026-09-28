/**
 * Pure helpers for the VehicleWarehouses page — kept out of the component so they
 * can be unit-tested without mounting a map.
 */

const EARTH_RADIUS_M = 6_371_000;
const toRad = (d) => (d * Math.PI) / 180;

/** Haversine distance in metres. Same formula the backend geofence check uses. */
export function distanceMeters(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Client-side search so typing filters instantly without a round trip. */
export function filterWarehouses(rows, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((w) =>
    [w.name, w.code, w.city, w.state]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q)),
  );
}

/**
 * Map bounds centre for a set of yards. Falls back to the centre of India so an
 * org with no warehouses yet still gets a usable map to drop its first pin on.
 */
export function centreOf(rows) {
  const pts = (rows || []).filter((w) => w.lat != null && w.lng != null);
  if (!pts.length) return { lat: 22.5, lng: 82.0 };
  const sum = pts.reduce((acc, w) => ({ lat: acc.lat + w.lat, lng: acc.lng + w.lng }), {
    lat: 0,
    lng: 0,
  });
  return { lat: sum.lat / pts.length, lng: sum.lng / pts.length };
}

/**
 * Validation mirroring the backend Joi schema, so the drawer can block a save
 * before it round-trips. India bounds + the GeofenceZone radius floor of 100 m
 * (below that the mirrored zone fails schema validation).
 */
export function validateWarehouse(form) {
  const errors = {};
  if (!form.name || !form.name.trim()) errors.name = 'Name is required';
  if (form.lat == null || Number.isNaN(Number(form.lat))) errors.lat = 'Drop a pin on the map';
  else if (form.lat < 6 || form.lat > 38) errors.lat = 'Latitude must be inside India';
  if (form.lng == null || Number.isNaN(Number(form.lng))) errors.lng = 'Drop a pin on the map';
  else if (form.lng < 68 || form.lng > 98) errors.lng = 'Longitude must be inside India';
  const r = Number(form.geofenceRadiusM);
  if (!Number.isFinite(r) || r < 100) errors.geofenceRadiusM = 'Minimum radius is 100 m';
  else if (r > 50000) errors.geofenceRadiusM = 'Maximum radius is 50,000 m';
  return errors;
}
