/**
 * Route deviations on one AutoTrip — pure helpers for the trip page.
 */

const DAY_MS = 24 * 3600 * 1000;
// The API caps a window at 92 days; the empty run before the pickup can start
// well before it, so the window opens 20 days early.
const LOOKBACK_MS = 20 * DAY_MS;
const MAX_WINDOW_MS = 90 * DAY_MS;

const ms = (d) => (d == null ? null : new Date(d).getTime());

/** from/to for GET /route-deviation/events?autoTripId=… covering the whole trip. */
export function deviationWindow(trip, now = Date.now()) {
  const start = ms(trip?.pickup?.arrivedAt) ?? ms(trip?.pickup?.departedAt);
  if (start == null) return null;
  const drops = [trip.drop, ...(trip.extraDrops || [])]
    .map((d) => ms(d?.arrivedAt))
    .filter((t) => t != null);
  const end = drops.length ? Math.max(...drops) : now;
  const from = start - LOOKBACK_MS;
  const to = Math.min(end + DAY_MS, from + MAX_WINDOW_MS);
  return { from: new Date(from).toISOString(), to: new Date(to).toISOString() };
}

/**
 * The stretch of the trip's own track each detour covers, for drawing it red
 * on the trip map. Runs from where the truck left the usual route to where it
 * came back (or the run's own start/end when those were not seen).
 */
export function detourSegments(trackPoints, deviations) {
  const fixes = (trackPoints || [])
    .map((p) => ({ lat: Number(p.latitude), lng: Number(p.longitude), t: ms(p.eventDateTime) }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.t != null);
  const out = [];
  for (const d of deviations || []) {
    const from = ms(d.geometry?.exitPoint?.at) ?? ms(d.startedAt);
    const to = ms(d.geometry?.rejoinPoint?.at) ?? ms(d.endedAt) ?? from;
    if (from == null) continue;
    const path = fixes
      .filter((p) => p.t >= from && p.t <= to)
      .map(({ lat, lng }) => ({ lat, lng }));
    if (path.length > 1) out.push({ id: d._id, path });
  }
  return out;
}

/** The deviation tab of Route Hub, opened on this one. */
export const deviationHref = (id) => `/route-hub?tab=deviation&d=${encodeURIComponent(id)}`;
