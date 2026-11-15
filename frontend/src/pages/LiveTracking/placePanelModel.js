import { placeStats } from '../PlaceHub/intelligence/model/siteSummary.js';

/**
 * placePanelModel — the rules behind the place panel's numbers.
 *
 * A place on the Track map is one of three things, each with its own id
 * shape: a warehouse ("warehouse:abc"), a geofence zone ("zone:abc") or a
 * Place Intelligence site ("site:abc"). The APIs know the bare id, so the
 * prefix has to come off before anything is asked for.
 */

/** The bare id the APIs know: "site:abc" → "abc". Null when there is no id. */
export function placeApiId(place) {
  if (!place) return null;
  const raw = place.sourceId ?? place.id ?? null;
  if (raw === null || raw === undefined) return null;
  const text = String(raw);
  const cut = text.indexOf(':');
  return cut === -1 ? text : text.slice(cut + 1);
}

/**
 * Is this one of OUR places — a plant, a yard, a zone, or a confirmed place?
 *
 * Anything else is a map landmark (a pump, a dhaba) that nobody owns, and it
 * has no visit history of ours to show.
 */
export function isOurPlace(place) {
  if (!place) return false;
  if (place.source === 'warehouse' || place.source === 'zone') return true;
  if (place.source === 'site') return place.status === 'CONFIRMED';
  const type = String(place.type || place.kind || '').toUpperCase();
  return type === 'SITE' || type === 'WAREHOUSE' || type === 'ZONE';
}

/**
 * The numbers about one place.
 *
 * The site's report is the first answer (visits, vehicles, dwell, idle cost);
 * the site's own record is the fallback for the lists that do not carry a
 * report. Unknown is never zero: a place we have no data for has no answer,
 * and that is what null means here.
 */
export function placePanelStats(place, report) {
  const own = placeStats(place?.raw);
  return {
    visits: report?.visits ?? own.visits ?? null,
    usualDwellMin: report?.dwellP50Min ?? own.medianDwellMin ?? null,
    vehicles: report?.vehicles ?? own.trucks ?? null,
    idleCost: report?.idleCost ?? null,
  };
}
