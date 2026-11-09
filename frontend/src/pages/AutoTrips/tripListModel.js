/**
 * The Trips list, as pure functions: place names, where each trip ended up, the
 * KPI strip and the "needs your answer" breakdown. No React, no I/O.
 */
import { toDate } from './autoTripFormat';

// ─── Place names ─────────────────────────────────────────────────────────────

/** Short words that read as words, not codes, when they come in capitals. */
const SMALL_WORDS = new Set(['of', 'the', 'and', 'at', 'in', 'on', 'to', 'by', 'near']);
/** Words that are real words even though they are three letters long. */
const SHORT_WORDS = new Set(['new', 'old', 'big', 'gate', 'the', 'ltd', 'pvt']);

/**
 * "AMBUJA DHULAGOR" → "Ambuja Dhulagor"; "JK BUXAR" → "JK Buxar"; "DALMIA OCL" →
 * "Dalmia OCL". Only a name written all in capitals is changed: a name a person
 * typed in mixed case ("UltraTech Cement Hooghly") is theirs and stays as it is.
 * Words of three letters or fewer stay in capitals (plant codes: JK, JSW, OCL, NH).
 */
export function titleCasePlace(name) {
  if (name == null) return '';
  const text = String(name).trim();
  if (!text || text !== text.toUpperCase() || !/[A-Z]/.test(text)) return text;
  return text
    .split(/(\s+|-|\/|\(|\))/)
    .map((part, index) => {
      if (!/[A-Z]/.test(part)) return part;
      const lower = part.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      if (part.length <= 3 && !SHORT_WORDS.has(lower)) return part;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

// ─── Where the trip ended up ────────────────────────────────────────────────

/**
 * The destination half of the route, as { text, title, state }:
 *   state 'reached'  – a named drop (text is the place, title-cased)
 *   state 'unnamed'  – a drop place we have no name for
 *   state 'guessed'  – the drop was guessed from where the truck turned round
 *   state 'missing'  – no drop found before the truck was back at a plant
 *   state 'moving'   – still on the way
 * `title` keeps the place's own spelling for the tooltip.
 */
export function destinationOf(trip) {
  const extraDrops = trip?.extraDrops || [];
  const drop = extraDrops.at(-1) ?? trip?.drop ?? null;
  const flags = trip?.flags || [];
  if (trip?.status === 'OPEN' && !drop?.arrivedAt) {
    // A trip that stayed open past the limit is stale, not on its way: there is
    // no ETA to show for it.
    if (flags.includes('STALE_OPEN')) {
      return { text: 'stale, no drop yet', title: null, state: 'missing' };
    }
    return { text: 'on the way', title: null, state: 'moving' };
  }
  if (
    (!extraDrops.length && flags.includes('DROP_UNKNOWN')) ||
    drop?.source === 'UNKNOWN' ||
    !drop
  ) {
    return { text: 'drop not found', title: null, state: 'missing' };
  }
  const name = drop.name || (drop.areaName ? `${drop.areaName} area` : null);
  if (
    (!extraDrops.length && flags.includes('DROP_INFERRED')) ||
    drop.source === 'INFERRED_TURNAROUND'
  ) {
    return name
      ? { text: `${titleCasePlace(name)} (guessed)`, title: name, state: 'guessed' }
      : { text: 'drop guessed', title: null, state: 'guessed' };
  }
  if (!name) return { text: 'unnamed drop place', title: null, state: 'unnamed' };
  return { text: titleCasePlace(name), title: name, state: 'reached' };
}

// ─── Numbers on a row ────────────────────────────────────────────────────────

/** The loaded run's km: the odometer when the truck has one, else the GPS path. */
export const loadedKm = (trip) => trip?.km?.ladenOdo ?? trip?.km?.laden ?? null;

/** Minutes from leaving the plant to the last drop (transit time when that is all we have). */
export const loadedMin = (trip) => trip?.durations?.ladenMin ?? trip?.durations?.transitMin ?? null;

/** Minutes since a truck still on the road left the plant; null for any other trip. */
export function minutesOnRoad(trip, now = new Date()) {
  if (trip?.status !== 'OPEN' || trip?.drop?.arrivedAt) return null;
  const left = toDate(trip?.pickup?.departedAt);
  if (!left) return null;
  const min = (now.getTime() - left.getTime()) / 60000;
  return min >= 0 ? min : null;
}

/** "3 h 5 min", "14 h", "2 d 4 h" — compact enough for one table cell. */
export function shortDuration(min) {
  if (min == null || Number.isNaN(Number(min))) return null;
  const total = Math.max(0, Math.round(Number(min)));
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  if (h < 10) {
    const m = total % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  // Past ten hours the minutes are noise in a list.
  if (h < 48) return `${h} h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d} d ${rh} h` : `${d} d`;
}

/** True when every row on the page has no value for this column. */
export function allUnknown(rows, read) {
  return Array.isArray(rows) && rows.length > 0 && rows.every((row) => read(row) == null);
}

// ─── KPI strip ───────────────────────────────────────────────────────────────

export function median(values) {
  const list = values
    .map(Number)
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);
  if (!list.length) return null;
  const mid = Math.floor(list.length / 2);
  return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
}

/** Fewer delivered trips than this and a "typical run" is one truck's story, not the fleet's. */
export const MIN_SAMPLE = 5;

/**
 * The typical loaded run of the latest delivered trips: median km and median time,
 * with how many trips it is the median of. Null fields when there are too few.
 */
export function typicalRun(items) {
  const rows = Array.isArray(items) ? items : [];
  const km = rows.map(loadedKm).filter((v) => v != null);
  const min = rows.map(loadedMin).filter((v) => v != null);
  return {
    km: km.length >= MIN_SAMPLE ? median(km) : null,
    min: min.length >= MIN_SAMPLE ? median(min) : null,
    sample: rows.length,
    measured: km.length,
  };
}

/** "20%" of a whole; null when the whole is zero. */
export function shareText(part, whole) {
  if (!whole) return null;
  const pct = (100 * (part || 0)) / whole;
  if (pct > 0 && pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
}

// ─── Needs your answer ───────────────────────────────────────────────────────

/** Why a trip is waiting for an answer, in the order an owner should read them. */
export const NEED_REASONS = [
  {
    key: 'DROP_UNKNOWN',
    label: 'Drop not found',
    why: 'The truck was back at a plant before it stopped anywhere we know as a drop.',
  },
  {
    key: 'DROP_INFERRED',
    label: 'Drop guessed',
    why: 'We took the point where the truck turned round as the drop. Confirm it or move it on the trip.',
  },
  {
    key: 'OTHER',
    label: 'Other checks',
    why: 'A short hop, a GPS gap or a drop that differs from the order.',
  },
];

/** Count a sample of waiting trips by reason. Each trip counts once, under its first reason. */
export function needReasons(items) {
  const counts = { DROP_UNKNOWN: 0, DROP_INFERRED: 0, OTHER: 0 };
  (Array.isArray(items) ? items : []).forEach((trip) => {
    const flags = trip?.flags || [];
    if (flags.includes('DROP_UNKNOWN') || trip?.drop?.source === 'UNKNOWN')
      counts.DROP_UNKNOWN += 1;
    else if (flags.includes('DROP_INFERRED') || trip?.drop?.source === 'INFERRED_TURNAROUND')
      counts.DROP_INFERRED += 1;
    else counts.OTHER += 1;
  });
  return NEED_REASONS.map((reason) => ({ ...reason, count: counts[reason.key] })).filter(
    (reason) => reason.count > 0,
  );
}

/**
 * The place-question queue as one sentence's numbers: how many places wait for a
 * name, how many trips naming all of them settles, and what the busiest few settle.
 */
export function placeQueue(items, top = 10) {
  const list = (Array.isArray(items) ? items : [])
    .map((q) => Number(q?.tripsAffected) || 0)
    .sort((a, b) => b - a);
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  return {
    places: list.length,
    trips: sum(list),
    top: Math.min(top, list.length),
    topTrips: sum(list.slice(0, top)),
  };
}
