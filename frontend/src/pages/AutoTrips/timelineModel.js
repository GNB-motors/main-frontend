/**
 * Auto Trips — pure helpers for the list, detail and map. No React, no I/O.
 */
import { dropLabel } from '../PlaceHub/intelligence/facilityText';
import { notReachedYet, toDate } from './autoTripFormat';

// ─── Trip timeline ───────────────────────────────────────────────────────────

const STOP_KIND_LABEL = {
  FUEL: 'Fuel stop',
  REST: 'Rest stop',
  OVERNIGHT: 'Overnight stop',
  DHABA: 'Food stop',
  FOOD: 'Food stop',
  TOLL: 'Toll plaza',
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

/**
 * What a stop after the plant was: a person's answer wins over the engine's guess. A stop the engine
 * could not explain inside a toll plaza is a toll stop: the place says so even when its stop does not.
 */
export function stopKind(stop) {
  const answer = stop?.humanReason?.purpose;
  if (answer) return STOP_KIND_LABEL[answer.toUpperCase()] ? answer.toUpperCase() : 'UNKNOWN';
  const top = (stop?.purpose?.top || '').toUpperCase();
  const known = !stop?.purpose?.unexplained && STOP_KIND_LABEL[top] ? top : 'UNKNOWN';
  return known === 'UNKNOWN' && stop?.place?.siteType === 'TOLL' ? 'TOLL' : known;
}

function stopPlace(stop) {
  if (stop?.place?.name) return stop.place.name;
  if (stop?.place) return 'Unconfirmed place';
  if (stop?.lat != null && stop?.lng != null) {
    return `Unnamed place · ${Number(stop.lat).toFixed(3)}, ${Number(stop.lng).toFixed(3)}`;
  }
  return 'Unnamed place';
}

/** When the truck left: the recorded time, else arrival plus the stay. */
function leftAtOf(endAt, startAt, stayMin) {
  if (endAt) return endAt;
  const start = toDate(startAt);
  return start && stayMin != null
    ? new Date(start.getTime() + stayMin * 60000).toISOString()
    : null;
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
      leftAt: pickup.departedAt || null,
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
        leftAt: leftAtOf(s.endAt || drop.departedAt, s.startAt, s.dwellMinutes ?? drop.dwellMin),
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
      leftAt: leftAtOf(s.endAt, s.startAt, s.dwellMinutes),
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
      leftAt: leftAtOf(d.departedAt, d.arrivedAt, d.dwellMin),
      stayMin: d.dwellMin ?? (i === 0 ? trip.durations?.dropMin : null) ?? null,
      playAt: d.arrivedAt,
      stop: null,
    });
  });

  return rows.sort((a, b) => toDate(a.at).getTime() - toDate(b.at).getTime());
}

/** A plant visit this long is worth a second look, so it shows amber. */
export const LONG_PLANT_MIN = 4 * 60;

const SPAN_KIND = { loading: 'plant', drop: 'drop', unknown: 'unknown', stop: 'stop' };

export const TIMELINE_SPANS = [
  { kind: 'plant', label: 'At plant' },
  { kind: 'drive', label: 'Driving' },
  { kind: 'unknown', label: 'Unknown stop' },
  { kind: 'stop', label: 'Other stops' },
  { kind: 'drop', label: 'Unloading' },
];

function minutesBetween(a, b) {
  const s = toDate(a);
  const e = toDate(b);
  if (!s || !e) return null;
  return Math.round((e.getTime() - s.getTime()) / 60000);
}

/**
 * The timeline as steps with the drive between each pair, and where the time went: each
 * step's stay, then the drive to the next (its arrival minus the last departure). Drives
 * up to the last drop are loaded and later ones empty; with no drop at all the load is
 * only known while the trip is still on its way.
 */
export function timelinePlan(trip) {
  const rows = timelineRows(trip);
  let lastDrop = -1;
  rows.forEach((r, i) => {
    if (r.kind === 'drop') lastDrop = i;
  });
  const onTheWay = notReachedYet(trip);

  const items = [];
  const spans = [];
  rows.forEach((row, i) => {
    if (i > 0) {
      const driveMin = minutesBetween(rows[i - 1].leftAt, row.at);
      let load = null;
      if (lastDrop >= 0) load = i <= lastDrop ? 'loaded' : 'empty';
      else if (onTheWay) load = 'loaded';
      items.push({
        type: 'leg',
        id: `leg-${row.id}`,
        driveMin: driveMin > 0 ? driveMin : null,
        load,
      });
      if (driveMin > 0) spans.push({ kind: 'drive', min: driveMin });
    }
    items.push({ type: 'step', ...row });
    if (row.stayMin > 0) spans.push({ kind: SPAN_KIND[row.kind], min: row.stayMin });
  });

  const byKind = new Map();
  spans.forEach((s) => byKind.set(s.kind, (byKind.get(s.kind) || 0) + s.min));
  const first = rows[0];
  const last = rows[rows.length - 1];
  return {
    items,
    spans,
    legend: TIMELINE_SPANS.filter((s) => byKind.get(s.kind) > 0).map((s) => ({
      ...s,
      min: byKind.get(s.kind),
    })),
    totalMin: spans.reduce((sum, s) => sum + s.min, 0),
    totalOf: first
      ? `${first.kind === 'loading' ? 'plant arrival' : 'first stop'} to ${
          last.kind === 'drop' ? 'drop' : 'last stop'
        } departure`
      : '',
  };
}
