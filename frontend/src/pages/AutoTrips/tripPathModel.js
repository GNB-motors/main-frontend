/**
 * The trip's path on the map: what the truck drove, split into the legs it drove
 * loaded (the driven path) and the legs it drove empty (the run to the plant and
 * the run back to it). Pure — no React, no Google Maps.
 */
import { toDate } from './autoTripFormat';

/** The driven path is solid indigo; the empty legs are dashed slate. */
export const PATH_COLORS = { loaded: '#4f46e5', empty: '#94a3b8' };

/**
 * When the truck was carrying, from the trip's own record: it left the plant
 * loaded and stayed loaded until the last drop. Before that it drove to the plant
 * empty; after it drove back empty. A trip with no plant or no drop leaves the
 * window open, and the whole path counts as driven.
 */
export function loadWindows(trip) {
  const pickup = trip?.pickup || {};
  const ladenStart = toDate(pickup.departedAt)?.getTime() ?? null;
  const drops = [trip?.drop, ...(trip?.extraDrops || [])].filter((d) => d && toDate(d.arrivedAt));
  const ladenEnd = drops.length
    ? Math.max(...drops.map((d) => toDate(d.arrivedAt).getTime()))
    : null;
  return { ladenStart, ladenEnd };
}

/** Whether the truck was carrying at that moment: 'loaded' or 'empty'. */
export function loadAt(at, windows) {
  if (!windows) return 'loaded';
  const { ladenStart, ladenEnd } = windows;
  if (ladenStart != null && at < ladenStart) return 'empty';
  if (ladenEnd != null && at > ladenEnd) return 'empty';
  return 'loaded';
}

/**
 * The frames as path segments. A segment is split where the GPS went quiet (a gap
 * is never joined with a straight line across it) and where the load changed.
 */
export function pathSegments(frames, windows) {
  const out = [];
  let current = null;
  (frames || []).forEach((f) => {
    const load = loadAt(f.at, windows);
    if (!current || f.isBreak || current.load !== load) {
      current = { load, points: [] };
      out.push(current);
    }
    current.points.push({ lat: f.lat, lng: f.lng, at: f.at });
  });
  return out;
}

/** The path of each segment, as map points. */
export function segmentPath(segment) {
  return segment.points.map((p) => ({ lat: p.lat, lng: p.lng }));
}

/**
 * The segments up to the playhead, each cut at the truck's position, so the map
 * can show how much of the trip has been driven.
 */
export function travelledSegments(segments, head) {
  if (!head) return [];
  const out = [];
  (segments || []).forEach((seg) => {
    const path = [];
    let cut = false;
    seg.points.forEach((p) => {
      if (p.at <= head.at) path.push({ lat: p.lat, lng: p.lng });
      else cut = true;
    });
    if (cut) path.push({ lat: head.lat, lng: head.lng });
    if (path.length > 1) out.push({ load: seg.load, path });
  });
  return out;
}
