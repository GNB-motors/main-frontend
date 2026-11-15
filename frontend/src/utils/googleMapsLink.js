/**
 * Free Google Maps URLs (Maps URLs API, no key, no cost).
 * https://www.google.com/maps/search/?api=1&query=...&query_place_id=...
 */

/** Build a Google Maps search URL for a place. */
export function googleMapsUrl(args = {}) {
  const { lat, lng, placeId, name } = args || {};
  const hasCoords = lat != null && lng != null;
  const query = hasCoords ? `${lat},${lng}` : name || '';
  if (!query) return null;
  const params = new URLSearchParams({ api: '1', query });
  if (placeId) params.set('query_place_id', placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/** Open a place in Google Maps in a new tab. No-op (returns false) without any target. */
export function openInGoogleMaps(args) {
  const url = googleMapsUrl(args);
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
