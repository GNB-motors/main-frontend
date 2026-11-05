/**
 * trackMapCamera — where the Track-mode map looks.
 *
 * Two decisions live here, so they can be tested without a map:
 *
 *  1. The padding the whole trail is fitted with. There is room above for the
 *    map's own controls, room below for the replay bar, and — when the Places
 *    panel covers the left of the map — room on the left too, so the trail is
 *    not fitted under the panel.
 *  2. When the truck comes close to the edge of the visible box it would be
 *    lost off the map, so the map is panned (never zoomed) to bring it back.
 *    The zoom never changes while the drive plays: the owner keeps the same
 *    scale the whole way through.
 */

/** The padding the trail is fitted with when the Places panel is closed. */
export const TRACK_FIT_PADDING = { top: 80, right: 60, bottom: 120, left: 60 };

/**
 * The Places panel covers the left of the map, so the trail is fitted to the
 * right of it.
 */
export const TRACK_FIT_PADDING_PLACES = { top: 80, right: 60, bottom: 120, left: 420 };

/** The padding for one fit, by whether the Places panel is open. */
export function trackFitPadding({ placesPanelOpen = false } = {}) {
  return placesPanelOpen ? { ...TRACK_FIT_PADDING_PLACES } : { ...TRACK_FIT_PADDING };
}

/**
 * Whether a point has come within `ratio` of the edge of the visible box.
 * `bounds` is { ne: { lat, lng }, sw: { lat, lng } }.
 */
export function isNearEdge(point, bounds, ratio = 0.15) {
  if (!point || !bounds?.ne || !bounds?.sw) return false;
  const { ne, sw } = bounds;
  const latSpan = Math.abs(ne.lat - sw.lat);
  const lngSpan = Math.abs(ne.lng - sw.lng);
  if (!latSpan || !lngSpan) return false;
  const fromNorth = (ne.lat - point.lat) / latSpan;
  const fromSouth = (point.lat - sw.lat) / latSpan;
  const fromEast = (ne.lng - point.lng) / lngSpan;
  const fromWest = (point.lng - sw.lng) / lngSpan;
  return (
    fromNorth < ratio || fromSouth < ratio || fromEast < ratio || fromWest < ratio
  );
}
