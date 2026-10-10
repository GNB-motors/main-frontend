/**
 * Road trail maths for every map (ROAD_INTELLIGENCE plan Task P4.8). Pure — no Google Maps or Leaflet objects,
 * so Google pages and the Leaflet RouteHub use the same code.
 * Input: the data of GET /api/road/trail/:reg. Output: drawable layers, the road-distance clock for replays,
 * clipping and on-road positions at a given time, a distance summary and a legend.
 */
import { decodePolyline6 } from './polyline6';

/** How each provenance kind is drawn (maths I.1: never present a guess as a road). */
export const KIND_STYLE = {
  MATCHED: { pattern: 'solid', tone: 'road', label: 'Road (matched)' },
  MATCHED_LOW: { pattern: 'dashed', tone: 'road', label: 'Road (low confidence)' },
  UNCALIBRATED: { pattern: 'dashed', tone: 'road', label: 'Road (accuracy not yet certified)' },
  FLEET_CONFIRMED: { pattern: 'solid', tone: 'fleet', label: 'Road learned from our trucks' },
  FLEET_PROVISIONAL: {
    pattern: 'dashed',
    tone: 'fleet',
    label: 'Road learned from our trucks (provisional)',
  },
  INFERRED: { pattern: 'dashed', tone: 'inferred', label: 'Likely road across a signal gap' },
  RAW: { pattern: 'dotted', tone: 'raw', label: 'GPS fixes not on a known road' },
};

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;

export function haversineM(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function cumulative(path) {
  const c = [0];
  for (let i = 1; i < path.length; i += 1) c.push(c[i - 1] + haversineM(path[i - 1], path[i]));
  return c;
}

/** Drawable layers in time order. STOP and gap segments have no line and are skipped here. */
export function toLayers(trail) {
  if (!trail || !Array.isArray(trail.segments)) return [];
  const out = [];
  for (const s of trail.segments) {
    const style = KIND_STYLE[s.kind];
    if (!style) continue;
    const path = s.geom
      ? decodePolyline6(s.geom)
      : (s.points || []).map((p) => ({ lat: p.lat, lng: p.lng }));
    if (path.length < 2) continue;
    out.push({
      kind: s.kind,
      ...style,
      t0: s.t0,
      t1: s.t1,
      distM: Number.isFinite(s.distM) ? s.distM : null,
      marks: Array.isArray(s.marks) && s.marks.length >= 2 ? s.marks : null,
      live: Boolean(s.live),
      path,
      cum: cumulative(path),
    });
  }
  return out.sort((a, b) => a.t0 - b.t0);
}

/** STOP segments as markers: [{ at: {lat,lng}, t0, t1 }]. */
export function stopsOf(trail) {
  if (!trail || !Array.isArray(trail.segments)) return [];
  return trail.segments
    .filter((s) => s.kind === 'STOP' && s.at)
    .map((s) => ({ at: s.at, t0: s.t0, t1: s.t1 }));
}

/** Piecewise-linear value of [[t, value], ...] at time t (clamped at both ends). null when empty. */
export function distanceAtTime(timeline, t) {
  if (!Array.isArray(timeline) || !timeline.length) return null;
  if (t <= timeline[0][0]) return timeline[0][1];
  const last = timeline[timeline.length - 1];
  if (t >= last[0]) return last[1];
  for (let i = 1; i < timeline.length; i += 1) {
    const [t1, v1] = timeline[i];
    if (t <= t1) {
      const [t0, v0] = timeline[i - 1];
      const f = t1 > t0 ? (t - t0) / (t1 - t0) : 1;
      return v0 + f * (v1 - v0);
    }
  }
  return last[1];
}

/** Metres along a layer's own path at time t: by its distance marks when it has them, else by time. */
function metresAt(layer, t) {
  const total = layer.cum[layer.cum.length - 1];
  if (t <= layer.t0) return 0;
  if (t >= layer.t1) return total;
  if (layer.marks) {
    const markTotal = layer.marks[layer.marks.length - 1][1];
    return markTotal > 0 ? (distanceAtTime(layer.marks, t) / markTotal) * total : 0;
  }
  return ((t - layer.t0) / Math.max(1, layer.t1 - layer.t0)) * total;
}

function pointAt(path, cum, m) {
  if (m <= 0) return path[0];
  const total = cum[cum.length - 1];
  if (m >= total) return path[path.length - 1];
  let i = 1;
  while (i < cum.length && cum[i] < m) i += 1;
  const seg = cum[i] - cum[i - 1];
  const f = seg > 0 ? (m - cum[i - 1]) / seg : 0;
  return {
    lat: path[i - 1].lat + f * (path[i].lat - path[i - 1].lat),
    lng: path[i - 1].lng + f * (path[i].lng - path[i - 1].lng),
  };
}

function slicePath(path, cum, m) {
  const out = [];
  for (let i = 0; i < path.length && cum[i] < m; i += 1) out.push(path[i]);
  out.push(pointAt(path, cum, m));
  return out;
}

/** Layers as travelled up to time t (for replays): finished layers whole, the current one cut at t. */
export function clipLayersAt(layers, t) {
  const out = [];
  for (const l of layers) {
    if (l.t0 > t) continue;
    if (l.t1 <= t) out.push(l);
    else out.push({ ...l, path: slicePath(l.path, l.cum, metresAt(l, t)), partial: true });
  }
  return out;
}

/**
 * The road driven between times a and b (an overspeed stretch, say): each road layer the span
 * touches, cut to the metres driven in it. RAW fixes and gaps carry no road, so none is drawn there.
 */
export function layersBetween(layers, a, b) {
  if (!(b > a)) return [];
  const out = [];
  for (const l of layers) {
    if (l.kind === 'RAW' || l.t1 <= a || l.t0 >= b) continue;
    const m0 = metresAt(l, a);
    const m1 = metresAt(l, b);
    if (!(m1 > m0)) continue;
    const head = slicePath(l.path, l.cum, m1);
    const start = pointAt(l.path, l.cum, m0);
    const path = [start, ...head.filter((_, i) => l.cum[i] > m0 && i < head.length - 1), head[head.length - 1]];
    out.push({ ...l, path, partial: true });
  }
  return out;
}

/** On-road position at time t, or null when t is not on a drawn road (RAW and gaps excluded). */
export function positionAt(layers, t) {
  const l = layers.find((x) => x.kind !== 'RAW' && x.t0 <= t && t <= x.t1);
  return l ? pointAt(l.path, l.cum, metresAt(l, t)) : null;
}

/** The distance figure a page shows, with its honest label. */
export function summaryOf(trail) {
  if (!trail || !trail.distance) return null;
  if (trail.mode === 'MATCHED' && Number.isFinite(trail.distance.roadM)) {
    return {
      km: trail.distance.roadM / 1000,
      label: 'on roads',
      certified: Boolean(trail.calibrated),
    };
  }
  if (trail.mode === 'RAW_ONLY') {
    return {
      km: (trail.distance.straightLineWithinDrivesM || 0) / 1000,
      label: 'straight-line estimate (no road data yet)',
      certified: false,
    };
  }
  return null;
}

/** Legend entries for the kinds present, in KIND_STYLE order. */
export function legendOf(layers) {
  const present = new Set(layers.map((l) => l.kind));
  return Object.entries(KIND_STYLE)
    .filter(([kind]) => present.has(kind))
    .map(([kind, s]) => ({ kind, ...s }));
}

export const toLatLngPairs = (path) => path.map((p) => [p.lat, p.lng]);
