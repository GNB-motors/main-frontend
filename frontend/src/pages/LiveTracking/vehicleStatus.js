/*
 * Status is decided once, by the backend's liveVehicleView (read through
 * utils/liveView.js viewOf). This file only counts it — it never re-derives a
 * status from raw speed / ignition / FleetEdge text (audit DC-07, DC-09, DC-16).
 */

/** Counts for the status cards, in one pass over the fleet (it runs on every live tick). */
export function countVehiclesByStatus(vehicles) {
  const c = { all: vehicles.length, moving: 0, stopped: 0, idling: 0, offline: 0, gps: 0 };
  for (const v of vehicles) {
    if (c[v.status] !== undefined && v.status !== 'all' && v.status !== 'gps') c[v.status] += 1;
    if (v.live) c.gps += 1;
  }
  return c;
}
