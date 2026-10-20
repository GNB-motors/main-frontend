/** Resolve normalized vehicle status */
export const resolveVehicleStatus = (v) => {
  if (!v) return 'Offline';
  const rawStatus = (v.status || '').toString().toLowerCase();
  const rawState = (v.state || '').toString().toLowerCase();
  const isIgnitionOn =
    v.ignition === true ||
    v.ignition === 'ON' ||
    v.ignition === 'on' ||
    v.ignition === 1 ||
    v.ignition === '1';
  const speed = typeof v.speed === 'number' && !isNaN(v.speed) ? v.speed : 0;

  if (v.isStale || rawState === 'offline' || rawStatus === 'offline' || rawStatus.includes('off')) {
    return 'Offline';
  }
  if (speed > 3 || rawStatus.includes('mov')) {
    return 'Moving';
  }
  if (rawStatus.includes('idl') || rawState.includes('idl') || (isIgnitionOn && speed <= 3)) {
    return 'Idling';
  }
  if (rawStatus.includes('break') || rawStatus.includes('workshop')) {
    return 'Breakdown';
  }
  if (rawStatus.includes('fault')) {
    return 'Faulty';
  }
  if (rawStatus.includes('geo')) {
    return 'Geofence';
  }
  return 'Stopped';
};

/** Counts for the status cards, in one pass over the fleet (it runs on every live tick). */
export function countVehiclesByStatus(vehicles) {
  const c = {
    all: vehicles.length,
    moving: 0,
    stopped: 0,
    idling: 0,
    offline: 0,
    breakdown: 0,
    faulty: 0,
    geofence: 0,
    gps: 0,
  };
  for (const v of vehicles) {
    if (v.status === 'moving') c.moving++;
    if (v.status === 'stopped') c.stopped++;
    if (v.status === 'idling') c.idling++;
    if (v.status === 'offline') c.offline++;
    if (v.status === 'breakdown' || v.status === 'workshop' || v.inWorkshop || v.isBreakdown) {
      c.breakdown++;
    }
    if (v.status === 'faulty' || v.hasFault || (v.alertsCount && v.alertsCount > 0)) c.faulty++;
    if (v.status === 'geofence' || v.inGeofenceAlert) c.geofence++;
    if (v.live) c.gps++;
  }
  return c;
}
