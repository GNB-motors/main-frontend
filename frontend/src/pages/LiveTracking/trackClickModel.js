/**
 * trackClickModel — the rules of the map's click menu.
 *
 * A click on the map is an offer: make this spot a place, watch it as a zone,
 * or open it in Google Maps. The radius a new place may have is bounded, and
 * only an owner or a manager may create places.
 */

/** The smallest fence a new place may have, in metres. */
export const PLACE_RADIUS_MIN = 50;

/** The largest fence a new place may have, in metres. */
export const PLACE_RADIUS_MAX = 5000;

/**
 * The radius actually sent to the server. A missing number is not zero — it is
 * the smallest allowed fence, because zero would mean "no fence at all".
 */
export function clampRadius(value, min = PLACE_RADIUS_MIN, max = PLACE_RADIUS_MAX) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * The items a click offers.
 *
 * "Make this a place" writes to the fleet's places, so it is shown only to the
 * people Place Hub lets edit (owner, manager, super admin).
 */
export function clickMenuItems({ canEdit = false } = {}) {
  const items = [];
  if (canEdit) items.push({ id: 'makePlace', label: 'Make this a place' });
  items.push({ id: 'alertZone', label: 'Alert zone here' });
  items.push({ id: 'openInGoogleMaps', label: 'Open in Google Maps' });
  return items;
}

/** The draft a click starts: a circle where the pointer landed. */
export function clickDraft({ lat, lng, name = '', radiusM = 100 } = {}) {
  return {
    shape: 'circle',
    name,
    center: Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
      ? { lat: Number(lat), lng: Number(lng) }
      : null,
    radiusM: clampRadius(radiusM),
  };
}

/**
 * What the page says after a place is declared.
 *
 * The backend answers `existing: true` when a saved place already covers the
 * pin. That is not a failure: the place is already on the map, and the owner is
 * told which one it is.
 */
export function declareOutcome(result) {
  const site = result?.site || null;
  const name = site?.name || 'this spot';
  return {
    site,
    existing: Boolean(result?.existing),
    message: result?.existing ? `Already a place: ${name}` : `Saved ${name}`,
  };
}
