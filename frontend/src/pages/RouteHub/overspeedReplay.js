/**
 * Overspeed on the replay map: where the truck was over the limit, drawn along the road it
 * drove, and the deep link from the overspeed audit into the replay. Pure.
 */
import { layersBetween, toLatLngPairs } from '../../lib/roadTrail';

const PAD_MS = 3600 * 1000;
const ms = (d) => new Date(d).getTime();

/**
 * Each overspeed event as the stretch to paint: on the matched road when the road engine has it
 * (`onRoad`), else the GPS fixes inside the event. An event with nothing to draw is left out.
 * @returns {{event: object, onRoad: boolean, paths: number[][][]}[]}
 */
export function overspeedStretches(trip, events) {
  const out = [];
  for (const event of events || []) {
    const a = ms(event.startAt);
    const b = ms(event.endAt);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !(b > a)) continue;
    const road = trip.roadLayers?.length ? layersBetween(trip.roadLayers, a, b) : [];
    if (road.length) {
      out.push({ event, onRoad: true, paths: road.map((l) => toLatLngPairs(l.path)) });
      continue;
    }
    const gps = (trip.fixes || []).filter((f) => ms(f.at) >= a && ms(f.at) <= b).map((f) => f.ll);
    if (gps.length >= 2) out.push({ event, onRoad: false, paths: [gps] });
  }
  return out;
}

/** Route Hub search params that open the replay on one overspeed event (an hour either side). */
export function replayParams({ vehicleId, event, limitKmh, durMin }) {
  return {
    tab: 'replay',
    v: String(vehicleId),
    from: new Date(ms(event.startAt) - PAD_MS).toISOString(),
    to: new Date(ms(event.endAt) + PAD_MS).toISOString(),
    at: new Date(ms(event.startAt)).toISOString(),
    limit: String(limitKmh),
    dur: String(durMin),
  };
}

/** The window a replay link carries, or null when it carries none. */
export function replayWindow(params) {
  const from = params.get('from') ? new Date(params.get('from')) : null;
  const to = params.get('to') ? new Date(params.get('to')) : null;
  if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || !(to > from)) {
    return null;
  }
  const at = params.get('at') ? new Date(params.get('at')) : null;
  const limitKmh = Number(params.get('limit'));
  const durMin = Number(params.get('dur'));
  return {
    from,
    to,
    at: at && !Number.isNaN(at.getTime()) ? at : null,
    limitKmh: Number.isFinite(limitKmh) && limitKmh > 0 ? limitKmh : null,
    durMin: Number.isFinite(durMin) && durMin > 0 ? durMin : null,
  };
}
