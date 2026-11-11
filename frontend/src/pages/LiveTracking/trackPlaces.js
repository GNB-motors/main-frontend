/* Places on the Track map — pure helpers, no React.

   Track shows the same places Place Hub shows, built by Place Hub's own
   mergePlaces, so a place has one name, type and colour on both pages. Only
   confirmed places come across: suggestions ("To review"), low-evidence and
   "Not a place" entries are review work and stay in Place Hub. */
import { mergePlaces } from '../PlaceHub/model/mergePlaces.js';
import { PLACE_GROUPS } from '../PlaceHub/model/placeGroups.js';
import { isNum } from '../PlaceHub/model/placeGeometry.js';

const TRACK_GROUP_IDS = ['warehouse', 'zone', 'trade', 'road', 'other'];
export const TRACK_PLACE_GROUPS = PLACE_GROUPS.filter((g) => TRACK_GROUP_IDS.includes(g.id));

export function confirmedPlaces({ warehouses = [], zones = [], sites = [] } = {}) {
  return mergePlaces({ warehouses, zones, sites }).filter(
    (p) => p.status === 'CONFIRMED' && TRACK_GROUP_IDS.includes(p.group),
  );
}

export function countPlacesByGroup(places) {
  const counts = Object.fromEntries(TRACK_GROUP_IDS.map((id) => [id, 0]));
  for (const p of places) counts[p.group] += 1;
  return counts;
}

export function placesInGroups(places, hiddenGroups) {
  if (!hiddenGroups || hiddenGroups.size === 0) return places;
  return places.filter((p) => !hiddenGroups.has(p.group));
}

const EARTH_M = 6371000;
const rad = (d) => (d * Math.PI) / 180;
function metresBetween(aLat, aLng, bLat, bLng) {
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(s)));
}

/* Ray casting on the [{lat, lng}] ring. Places are a few hundred metres to a
   few km across, so treating lat/lng as planar is exact enough here. */
function insideRing(ring, lat, lng) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i];
    const b = ring[j];
    if (
      a.lat > lat !== b.lat > lat &&
      lng < ((b.lng - a.lng) * (lat - a.lat)) / (b.lat - a.lat) + a.lng
    )
      inside = !inside;
  }
  return inside;
}

/** Is (lat, lng) inside the place: its polygon when it has one, else its radius. */
export function placeContains(place, lat, lng) {
  if (!place || !isNum(lat) || !isNum(lng)) return false;
  // A real area: inside the outer ring of any part, but never inside its hole.
  if (place.polygonParts?.length) {
    return place.polygonParts.some((part) => {
      const [outer, ...holes] = part || [];
      if (!outer || !insideRing(outer, lat, lng)) return false;
      return !holes.some((hole) => insideRing(hole, lat, lng));
    });
  }
  if (place.polygon) return insideRing(place.polygon, lat, lng);
  if (!isNum(place.radiusM) || place.radiusM <= 0) return false;
  return metresBetween(place.lat, place.lng, lat, lng) <= place.radiusM;
}

/** The live vehicles (with a GPS fix) currently inside the place. */
export function vehiclesAtPlace(place, vehicles = []) {
  return vehicles.filter((v) => v.hasGpsFix === true && placeContains(place, v.lat, v.lng));
}

/** Name, type or address contains the query (case-insensitive). */
export function searchPlaces(places, query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return places;
  return places.filter((p) =>
    [p.name, p.subtitle, p.type].some((s) =>
      String(s || '')
        .toLowerCase()
        .includes(q),
    ),
  );
}

/** place id → how many fleet vehicles are inside it now. */
export function vehicleCountsByPlace(places, vehicles = []) {
  const withFix = vehicles.filter((v) => v.hasGpsFix === true);
  const out = new Map();
  for (const p of places) {
    let n = 0;
    for (const v of withFix) if (placeContains(p, v.lat, v.lng)) n += 1;
    out.set(p.id, n);
  }
  return out;
}
