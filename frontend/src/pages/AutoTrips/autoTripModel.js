/**
 * Auto Trips — pure helpers for the list, detail and map. No React, no I/O.
 */

export const FLAG_LABEL = {
  DROP_INFERRED: 'Drop guessed from the turnaround',
  DROP_UNKNOWN: 'Drop not found',
  PICKUP_TO_PICKUP: 'Loaded again without a known drop',
  STALE_OPEN: 'On the road for over 10 days',
  GPS_GAP: 'GPS went quiet on the way',
  NO_ERP_TRIP: 'No ERP trip',
  ERP_DROP_MISMATCH: 'Drop differs from the order',
};

export const DROP_SOURCE_LABEL = {
  LABELLED_PLACE: 'drop place',
  HUMAN: 'set by a person',
  INFERRED_TURNAROUND: 'guessed',
  UNKNOWN: 'not found',
};

export const COVERAGE_REASON_LABEL = {
  NO_CONFIRMED_PICKUP: 'Has stops, but none at a confirmed pickup place',
  NO_STOPS: 'No GPS stops yet',
};

/** Confirmed types that are already drop places: marking them again changes nothing. */
const DROP_TYPES = ['UNLOADING', 'PLANT'];
/** A company yard or warehouse is never re-answered as a drop from here. */
const OWN_YARD_TYPES = ['WAREHOUSE', 'YARD'];

const hasLatLng = (p) => Boolean(p) && p.lat != null && p.lng != null;
const at = (p) => ({ lat: p.lat, lng: p.lng });
const sameSpot = (a, b) => Boolean(a && b) && a.lat === b.lat && a.lng === b.lng;

/**
 * Points for the trip map. The line runs pickup → each stop after the plant in time
 * order; stops that are the drop (or a further drop) get the D markers, not a dot.
 */
export function routeMapPoints({ pickup, drop, extraDrops, routeStops }) {
  const p = hasLatLng(pickup) ? at(pickup) : null;
  const d = hasLatLng(drop) ? at(drop) : null;
  const extras = (extraDrops || []).filter(hasLatLng).map((x, i) => ({
    id: `drop-${x.arrivedAt || `${x.lat},${x.lng}`}`,
    at: at(x),
    label: `D${i + 2}`,
  }));
  const route = (routeStops || []).filter(hasLatLng);
  const stops = route
    .map((s) => ({ id: s._id, at: at(s) }))
    .filter((s) => !sameSpot(s.at, d) && !extras.some((x) => sameSpot(s.at, x.at)));
  const path = [p, ...route.map(at)].filter(Boolean);
  const all = [...path, d, ...extras.map((x) => x.at)].filter(Boolean);
  return { pickup: p, drop: d, extras, stops, path, all };
}

/** Whether this stop is the trip's current drop. */
export function isCurrentDrop(stop, trip) {
  const dropAt = trip?.drop?.arrivedAt;
  return Boolean(dropAt) && new Date(stop.startAt).getTime() === new Date(dropAt).getTime();
}

/**
 * "Set as drop and mark the place" is offered only when the stop is at a known place that
 * is not already a confirmed drop place, and not a company yard.
 */
export function canMarkPlace(stop) {
  const place = stop?.place;
  if (!stop?.orgSiteId || !place) return false;
  if (place.status !== 'CONFIRMED') return true;
  return !DROP_TYPES.includes(place.siteType) && !OWN_YARD_TYPES.includes(place.siteType);
}

/** What to call a stop in the list: its place, else what the truck was doing there. */
export function stopLabel(stop) {
  if (stop?.place?.name) return stop.place.name;
  if (stop?.place)
    return stop.place.status === 'CONFIRMED' ? stop.place.siteType : 'Unconfirmed place';
  return stop?.purpose?.top ? stop.purpose.top.toLowerCase() : 'Unknown place';
}

/**
 * A guessed drop at a known place is a question for the Places page: answering it there
 * settles every trip that turned around at it.
 */
export function answerPlaceHref(trip) {
  const drop = trip?.drop;
  if (!drop?.orgSiteId || drop.source !== 'INFERRED_TURNAROUND') return null;
  return `/places?place=${drop.orgSiteId}`;
}
