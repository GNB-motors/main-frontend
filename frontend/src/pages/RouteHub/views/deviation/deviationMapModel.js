/**
 * What the deviation map and timeline draw, from one GET /route-deviation/events/:id.
 * Pure: no Leaflet, no React.
 */
import { clock } from './deviationRules';

const ms = (d) => (d == null ? null : new Date(d).getTime());
const ok = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng);
const ll = (p) => [p.lat, p.lng];

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
      label: `Farthest point: ${Number(event.maxOffKm || 0).toFixed(1)} km off the usual route`,
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
  const usual = (corridor?.line || []).filter(ok).map(ll);
  return {
    band,
    usual: usual.length > 1 ? usual : [],
    approach,
    laden,
    detour: detourLine,
    markers,
    bounds: {
      detour: detourLine.length ? detourLine : tripPoints,
      trip: tripPoints.length ? tripPoints : detourLine.concat(band),
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
  const bands = runs
    .filter((r) => r && r.startedAt)
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
  };
}
