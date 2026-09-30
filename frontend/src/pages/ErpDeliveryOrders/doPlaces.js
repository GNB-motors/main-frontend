/**
 * Pure rules for a delivery order's exact pickup and drop points.
 *
 * The route stays the pricing key; these are where the truck actually loads and
 * unloads. Only the roles that can create a depot may add a new place; everyone
 * who can raise a DO may pick one already saved.
 */

export const PLACE_EDITOR_ROLES = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];

export const DEFAULT_RADIUS_M = 500;
export const MIN_RADIUS_M = 50;
export const MAX_RADIUS_M = 5000;

export const canAddPlaces = (role) => PLACE_EDITOR_ROLES.includes(String(role || '').toUpperCase());

/** Why the pickup/drop pair can't be submitted yet, or null when it can. */
export function placesProblem({ pickupSiteId, dropSiteId }) {
  if (!pickupSiteId) return 'Choose the pickup point';
  if (!dropSiteId) return 'Choose the drop point';
  if (String(pickupSiteId) === String(dropSiteId))
    return 'Pickup and drop must be different places';
  return null;
}

export const clampRadius = (value) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_RADIUS_M;
  return Math.min(MAX_RADIUS_M, Math.max(MIN_RADIUS_M, n));
};

/** A new place needs a name of two characters or more and a pin on the map. */
export const canSaveNewPlace = ({ name, location }) =>
  String(name || '').trim().length >= 2 &&
  Number.isFinite(location?.lat) &&
  Number.isFinite(location?.lng);

/** Body for POST /api/places/erp-sites from the new-place form. */
export const declarePayload = ({ name, location, radiusM }) => ({
  name: String(name).trim(),
  lat: location.lat,
  lng: location.lng,
  radiusM: clampRadius(radiusM),
  address: location.address || '',
});

/**
 * The name to suggest for a freshly pinned place: the first part of the picked
 * address ("Balaji Plant, NH-37, Dibrugarh" → "Balaji Plant"), never a raw pin.
 */
export const suggestedName = (location) =>
  String(location?.address || '')
    .split(',')[0]
    .trim();

/**
 * Google Maps link for a stored point, or null when the site wasn't populated
 * (list rows carry only the id and the snapshot name).
 */
export const placeMapUrl = (site) =>
  site && Number.isFinite(site.centroidLat) && Number.isFinite(site.centroidLng)
    ? `https://www.google.com/maps?q=${site.centroidLat},${site.centroidLng}`
    : null;
