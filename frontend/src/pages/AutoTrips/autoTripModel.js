/**
 * Auto Trips — pure helpers for the list, detail and map. No React, no I/O.
 */
import { dropLabel } from '../PlaceIntelligence/facilityText';

export const FLAG_LABEL = {
  DROP_INFERRED: 'Drop guessed from the turnaround',
  DROP_UNKNOWN: 'Drop not found',
  PICKUP_TO_PICKUP: 'Loaded again without a known drop',
  STALE_OPEN: 'On the road for over 10 days',
  GPS_GAP: 'GPS went quiet on the way',
  KM_ESTIMATED: 'Distance partly estimated (GPS gap)',
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

// ─── Status ──────────────────────────────────────────────────────────────────

export const STATUS_LABEL = {
  COMPLETE: 'Delivered',
  CONFIRMED: 'Confirmed',
  NEEDS_REVIEW: 'Needs a check',
  OPEN: 'On the road',
  DISMISSED: 'Rejected',
};

export const STATUS_CLASS = {
  COMPLETE: 'atx-status--delivered',
  CONFIRMED: 'atx-status--confirmed',
  NEEDS_REVIEW: 'atx-status--review',
  OPEN: 'atx-status--open',
  DISMISSED: 'atx-status--rejected',
};

/** The truck has left the plant and not reached a drop yet. */
export const notReachedYet = (trip) => trip?.status === 'OPEN' && !trip?.drop?.arrivedAt;

// ─── Formatting (local time, the way the trip pages print it) ───────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toDate(v) {
  if (v == null || v === '') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "8:30 pm" */
export function fmtClock(v) {
  const d = toDate(v);
  if (!d) return '—';
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

/** "7 Oct, 8:30 pm" — or "07 Oct, 8:30 pm" with padDay, as in the trip list. */
export function fmtDayTime(v, { padDay = false } = {}) {
  const d = toDate(v);
  if (!d) return '—';
  const day = padDay ? String(d.getDate()).padStart(2, '0') : String(d.getDate());
  return `${day} ${MONTHS[d.getMonth()]}, ${fmtClock(d)}`;
}

const dayText = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** "7–8 Oct 2026", "30 Sep – 1 Oct 2026", "7 Oct 2026". Empty when neither end is known. */
export function fmtDateRange(a, b) {
  const s = toDate(a);
  const e = toDate(b);
  if (!s || !e) return s || e ? dayText(s || e) : '';
  if (s.getFullYear() !== e.getFullYear()) return `${dayText(s)} – ${dayText(e)}`;
  if (s.getMonth() !== e.getMonth()) {
    return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${dayText(e)}`;
  }
  if (s.getDate() !== e.getDate()) {
    return `${s.getDate()}–${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  }
  return dayText(s);
}

/** "15 h 3 min", "45 min", "2 h". */
export function fmtDuration(min) {
  if (min == null || Number.isNaN(Number(min))) return '—';
  const total = Math.max(0, Math.round(Number(min)));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** "1,270 km" */
export function fmtKm(v) {
  if (v == null || Number.isNaN(Number(v))) return '—';
  return `${Math.round(Number(v)).toLocaleString('en-IN')} km`;
}

/** The days a trip spans, from reaching the plant to its last drop. */
export function tripDateRange(trip) {
  const start = trip?.pickup?.arrivedAt || trip?.pickup?.departedAt;
  const arrivals = [trip?.drop, ...(trip?.extraDrops || [])]
    .map((d) => toDate(d?.arrivedAt))
    .filter(Boolean);
  if (!arrivals.length) {
    const since = fmtDateRange(start);
    return since ? `${since} · on the road` : 'On the road';
  }
  return fmtDateRange(start, new Date(Math.max(...arrivals.map((d) => d.getTime()))));
}

// ─── Stops on the way ────────────────────────────────────────────────────────

function joinOr(words) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} or ${words[words.length - 1]}`;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** "1 unknown stop · no fuel, rest or overnight stops" */
export function stopsOnWayText(summary) {
  if (!summary) return '—';
  const n = (k) => Number(summary[k]) || 0;
  const kinds = ['fuel', 'rest', 'overnight'];
  const parts = [];
  if (n('unexplained')) parts.push(plural(n('unexplained'), 'unknown stop'));
  kinds.filter((k) => n(k)).forEach((k) => parts.push(plural(n(k), `${k} stop`)));
  const none = kinds.filter((k) => !n(k));
  if (none.length) parts.push(`no ${joinOr(none)} stops`);
  return parts.join(' · ');
}

// ─── Trip timeline ───────────────────────────────────────────────────────────

const STOP_KIND_LABEL = {
  FUEL: 'Fuel stop',
  REST: 'Rest stop',
  OVERNIGHT: 'Overnight stop',
  DHABA: 'Food stop',
  FOOD: 'Food stop',
  TOLL: 'Toll',
  PARKING: 'Parking',
  SERVICE: 'Service stop',
  REPAIR: 'Repair stop',
  BREAKDOWN: 'Breakdown',
  WEIGHBRIDGE: 'Weighbridge',
  LOADING: 'Possible loading',
  UNLOADING: 'Possible unloading',
  UNKNOWN: 'Unknown stop',
};

const DROP_NOTE = {
  LABELLED_PLACE: 'drop place',
  HUMAN: 'set by a person',
  INFERRED_TURNAROUND: 'guessed',
};

/** What a stop after the plant was: a person's answer wins over the engine's guess. */
export function stopKind(stop) {
  const answer = stop?.humanReason?.purpose;
  if (answer) return STOP_KIND_LABEL[answer.toUpperCase()] ? answer.toUpperCase() : 'UNKNOWN';
  if (stop?.purpose?.unexplained) return 'UNKNOWN';
  const top = (stop?.purpose?.top || '').toUpperCase();
  return STOP_KIND_LABEL[top] ? top : 'UNKNOWN';
}

function stopPlace(stop) {
  if (stop?.place?.name) return stop.place.name;
  if (stop?.place) return 'Unconfirmed place';
  if (stop?.lat != null && stop?.lng != null) {
    return `Unnamed place · ${Number(stop.lat).toFixed(3)}, ${Number(stop.lng).toFixed(3)}`;
  }
  return 'Unnamed place';
}

/**
 * One row per step of the trip, in time order: loading at the plant, every stop after
 * it, and each drop. Row kinds: loading | drop | stop | unknown.
 */
export function timelineRows(trip) {
  if (!trip) return [];
  const rows = [];
  const pickup = trip.pickup || {};
  const pickupAt = pickup.arrivedAt || pickup.departedAt;
  if (pickupAt) {
    rows.push({
      id: 'pickup',
      kind: 'loading',
      label: 'Loading',
      place: pickup.name || 'Pickup place',
      placeNote: 'plant',
      at: pickupAt,
      stayMin: trip.durations?.plantMin ?? pickup.dwellMin ?? null,
      playAt: pickup.departedAt || pickupAt,
      stop: null,
    });
  }

  const drops = [trip.drop, ...(trip.extraDrops || [])].filter((d) => d && toDate(d.arrivedAt));
  const dropAt = new Map(drops.map((d) => [toDate(d.arrivedAt).getTime(), d]));
  const shown = new Set();

  (trip.routeStops || []).forEach((s) => {
    const t = toDate(s.startAt)?.getTime();
    const drop = t == null ? null : dropAt.get(t);
    if (drop) {
      shown.add(t);
      rows.push({
        id: s._id,
        kind: 'drop',
        label: 'Unloading',
        place: dropLabel(drop),
        placeNote: DROP_NOTE[drop.source] || null,
        at: s.startAt,
        stayMin: s.dwellMinutes ?? drop.dwellMin ?? null,
        playAt: s.startAt,
        stop: s,
      });
      return;
    }
    const kind = stopKind(s);
    rows.push({
      id: s._id,
      kind: kind === 'UNKNOWN' ? 'unknown' : 'stop',
      label: STOP_KIND_LABEL[kind],
      place: stopPlace(s),
      placeNote: null,
      at: s.startAt,
      stayMin: s.dwellMinutes ?? null,
      playAt: s.startAt,
      stop: s,
    });
  });

  drops.forEach((d, i) => {
    const t = toDate(d.arrivedAt).getTime();
    if (shown.has(t)) return;
    rows.push({
      id: `drop-${i}`,
      kind: 'drop',
      label: 'Unloading',
      place: dropLabel(d),
      placeNote: DROP_NOTE[d.source] || null,
      at: d.arrivedAt,
      stayMin: d.dwellMin ?? (i === 0 ? trip.durations?.dropMin : null) ?? null,
      playAt: d.arrivedAt,
      stop: null,
    });
  });

  return rows.sort((a, b) => toDate(a.at).getTime() - toDate(b.at).getTime());
}

/** Whether a time falls inside the replay window, so "play from here" can jump to it. */
export function inWindow(at, track) {
  const t = toDate(at)?.getTime();
  const from = toDate(track?.from)?.getTime();
  const to = toDate(track?.to)?.getTime();
  if (t == null || from == null || to == null) return false;
  return t >= from && t <= to;
}
