/**
 * What the deviation map and timeline draw, from one GET /route-deviation/events/:id.
 * Pure: no Leaflet, no React.
 */
import { clock } from './deviationRules';

const ms = (d) => (d == null ? null : new Date(d).getTime());
const ok = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng);
const ll = (p) => [p.lat, p.lng];

export function padBounds(points, padKm = 2) {
  const list = (points || []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (!list.length) return [];
  const lats = list.map((p) => p[0]);
  const lngs = list.map((p) => p[1]);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const latPad = padKm / 111.32;
  const lngPad = padKm / (111.32 * Math.max(0.01, Math.abs(Math.cos(midLat * Math.PI / 180))));
  return [[Math.min(...lats) - latPad, Math.min(...lngs) - lngPad], [Math.max(...lats) + latPad, Math.max(...lngs) + lngPad]];
}

/**
 * Trip track split into the empty run to the pickup and the loaded run after
 * it. A GPS gap (`break`) starts a new line so the map never draws a straight
 * line across a stretch the truck was not seen on.
 */
export function splitTrack(points, ladenFromMs) {
  const approach = [];
  const laden = [];
  let line = null;
  let lineKind = null;
  for (const p of points || []) {
    if (!Number.isFinite(p.latitude) || !Number.isFinite(p.longitude)) continue;
    const t = ms(p.eventDateTime);
    const kind = ladenFromMs != null && t != null && t < ladenFromMs ? 'approach' : 'laden';
    if (!line || p.break || kind !== lineKind) {
      // Carry the last fix over a leg change so the two lines meet.
      const carry = line && !p.break && kind !== lineKind ? [line[line.length - 1]] : [];
      line = carry;
      lineKind = kind;
      (kind === 'approach' ? approach : laden).push(line);
    }
    line.push([p.latitude, p.longitude]);
  }
  const keep = (lines) => lines.filter((l) => l.length > 1);
  return { approach: keep(approach), laden: keep(laden) };
}

export function mapModel(detail) {
  if (!detail) return null;
  const { event = {}, detour = {}, corridor, trip, track } = detail;
  const ladenFrom = ms(trip?.pickup?.departedAt) ?? ms(trip?.pickup?.arrivedAt);
  const { approach, laden } = splitTrack(track?.points, trip ? ladenFrom : null);

  const detourLine = [detour.exitPoint, ...(detour.path || []), detour.rejoinPoint]
    .filter(ok)
    .map(ll);

  const markers = [];
  if (ok(trip?.pickup)) {
    markers.push({
      kind: 'pickup',
      at: ll(trip.pickup),
      label: `Loaded at ${trip.pickup.name || 'pickup'}`,
    });
  }
  (trip?.drops || []).filter(ok).forEach((d, i) => {
    markers.push({
      kind: 'drop',
      key: `drop${i}`,
      at: ll(d),
      label: `Drop: ${d.name || 'unnamed place'}`,
    });
  });
  if (ok(detour.exitPoint)) {
    markers.push({
      kind: 'exit',
      at: ll(detour.exitPoint),
      label: `Left the usual route${detour.exitPoint.at ? ` · ${clock(detour.exitPoint.at)}` : ''}`,
    });
  }
  if (ok(detour.maxOffPoint)) {
    markers.push({
      kind: 'maxOff',
      at: ll(detour.maxOffPoint),
      label: event.maxOffKm == null ? 'Farthest point: distance unknown' : `Farthest point: ${Number(event.maxOffKm).toFixed(1)} km off the usual route`,
    });
  }
  if (ok(detour.rejoinPoint)) {
    markers.push({
      kind: 'rejoin',
      at: ll(detour.rejoinPoint),
      label: `Back on the usual route${detour.rejoinPoint.at ? ` · ${clock(detour.rejoinPoint.at)}` : ''}`,
    });
  }

  const tripPoints = [...approach.flat(), ...laden.flat(), ...markers.map((m) => m.at)];
  const band = (corridor?.band || []).filter(ok).map(ll);
  const engineUsual = detail.roadEngine?.usualRoute ?? detail.usualRoute;
  let usual = Array.isArray(engineUsual) ? engineUsual.filter((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)) : (corridor?.line || []).filter(ok).map(ll);
  if (usual.length > 2 && ok(detour.exitPoint) && ok(detour.rejoinPoint)) {
    const nearest = (point) => usual.reduce((best, p, i) => {
      const distance = (p[0] - point.lat) ** 2 + (p[1] - point.lng) ** 2;
      return distance < best.distance ? { i, distance } : best;
    }, { i: 0, distance: Infinity }).i;
    const a = nearest(detour.exitPoint), b = nearest(detour.rejoinPoint);
    if (a !== b) usual = usual.slice(Math.min(a, b), Math.max(a, b) + 1);
  }
  const raw = detail.roadEngine?.geometry?.offRoute ?? detail.geometry?.offRoute;
  const driven = Array.isArray(raw) && raw.length > 1 ? raw : detourLine;
  const anchors = [...driven, ...[detour.exitPoint, detour.rejoinPoint].filter(ok).map(ll)];
  let nearbyRoad = [];
  if (anchors.length) {
    const lats = anchors.map((p) => p[0]);
    const lngs = anchors.map((p) => p[1]);
    const south = Math.min(...lats), north = Math.max(...lats);
    const west = Math.min(...lngs), east = Math.max(...lngs);
    const latMargin = Math.max((north - south) * 0.3, 0.005);
    const lngMargin = Math.max((east - west) * 0.3, 0.005);
    nearbyRoad = usual.filter(([lat, lng]) => lat >= south - latMargin && lat <= north + latMargin && lng >= west - lngMargin && lng <= east + lngMargin);
  }
  return {
    band,
    usual: usual.length > 1 ? usual : [],
    approach,
    laden,
    detour: detourLine,
    driven,
    drivenIsRaw: true,
    judged: usual.length > 1,
    markers,
    bounds: {
      detour: anchors.length ? padBounds(anchors.concat(nearbyRoad)) : tripPoints,
      trip: tripPoints.concat(usual, driven, band),
    },
  };
}

const pct = (t, start, span) => Math.min(100, Math.max(0, ((t - start) / span) * 100));

/**
 * The strip under the map: the trip from start to end, where the truck was
 * loaded, and every detour of this trip (the selected one marked).
 */
export function timelineModel(detail, siblings = []) {
  const start = ms(detail?.track?.from);
  const end = ms(detail?.track?.to);
  if (start == null || end == null || end <= start) return null;
  const span = end - start;
  const ladenFrom = ms(detail.trip?.pickup?.departedAt);
  const currentId = detail.event?._id;
  const runs = siblings.some((s) => s._id === currentId) ? siblings : [detail.event, ...siblings];
  const eventStart = ms(detail.event?.startedAt);
  const eventEnd = ms(detail.event?.endedAt) ?? eventStart;
  const outsideTrip = eventStart != null && (eventStart < start || eventEnd > end);
  const bands = runs
    .filter((r) => r && r.startedAt && ms(r.startedAt) >= start && (ms(r.endedAt) ?? ms(r.startedAt)) <= end)
    .map((r) => {
      const s = ms(r.startedAt);
      const e = Math.max(ms(r.endedAt) ?? s, s);
      const left = pct(s, start, span);
      return {
        id: r._id,
        left,
        // A short run is still a visible tick.
        width: Math.max(0.8, pct(e, start, span) - left),
        current: r._id === currentId,
        label: clock(r.startedAt),
      };
    });
  return {
    start,
    end,
    ladenLeft: detail.trip && ladenFrom != null ? pct(ladenFrom, start, span) : null,
    bands,
    outsideTrip,
  };
}
