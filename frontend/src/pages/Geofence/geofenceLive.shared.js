/**
 * Adapter between the liveStream `positions` contract and the row shape the
 * geofence pages consume from GET /api/geofence/live-locations and /api/livetracking/positions.
 *
 * Normalizes latitude/longitude -> lat/lng (finite numbers), guarantees a valid
 * status category matching FLEET_EDGE_ICONS, and preserves registrationNumber.
 */
export function toGeofenceLiveVehicle(row) {
  if (!row) return null;

  const rawLat = row.lat ?? row.latitude;
  const rawLng = row.lng ?? row.longitude;
  const lat = rawLat != null && rawLat !== '' ? Number(rawLat) : null;
  const lng = rawLng != null && rawLng !== '' ? Number(rawLng) : null;

  // Normalize status into one of FLEET_EDGE_ICONS keys
  const rawStatus = String(row.status || '').trim();
  let status = 'Offline';
  if (/moving/i.test(rawStatus)) {
    status = 'Moving';
  } else if (/stopped/i.test(rawStatus) || /parked/i.test(rawStatus)) {
    status = 'Stopped';
  } else if (/idling/i.test(rawStatus) || /idle/i.test(rawStatus)) {
    status = 'Idling';
  } else if (/breakdown/i.test(rawStatus)) {
    status = 'Breakdown';
  } else if (/faulty/i.test(rawStatus)) {
    status = 'Faulty';
  } else if (/offline/i.test(rawStatus)) {
    status = 'Offline';
  } else if (row.state === 'ACTIVE') {
    status = row.ignition === false ? 'Idling' : 'Moving';
  } else if (row.state === 'PARKED') {
    status = 'Stopped';
  } else if (rawStatus) {
    status = rawStatus;
  }

  return {
    vehicleId: row.vehicleId || row.registrationNumber || row.vin || null,
    registrationNumber: row.registrationNumber || row.vin || row.vehicleNumber || 'Vehicle',
    lat: Number.isFinite(lat) && lat !== 0 ? lat : null,
    lng: Number.isFinite(lng) && lng !== 0 ? lng : null,
    speed: typeof row.speed === 'number' ? row.speed : null,
    status,
    fuelLevel: row.fuelLevel ?? row.primaryFuelLevel ?? null,
    odometer: row.odometer ?? null,
    lastSeenAt: row.lastSeenAt ?? row.eventDateTime ?? row.lastUpdatedAt ?? null,
    isStale: Boolean(row.isStale),
  };
}

export default toGeofenceLiveVehicle;
