/**
 * Adapter between the liveStream `positions` contract and the row shape the
 * geofence pages have always consumed from GET /api/geofence/live-locations.
 *
 * The stream speaks the LiveVehiclePosition row shape (latitude/longitude,
 * state, primaryFuelLevel, eventDateTime); the geofence UI pins, pills and
 * info windows read the FleetEdge-style shape (lat/lng, status, fuelLevel,
 * lastSeenAt) keyed by FLEET_EDGE_ICONS. Both shapes carry
 * registrationNumber, which is the merge key for streamed diffs.
 */
export function toGeofenceLiveVehicle(row) {
  if (!row) return null;
  const status =
    row.status ||
    (row.state === 'ACTIVE'
      ? row.ignition === false
        ? 'Idling'
        : 'Moving'
      : row.state === 'PARKED'
        ? 'Stopped'
        : 'Offline');

  return {
    vehicleId: row.registrationNumber || row.vin || row.vehicleId || null,
    registrationNumber: row.registrationNumber || row.vin || row.vehicleNumber || null,
    lat: row.lat ?? row.latitude ?? null,
    lng: row.lng ?? row.longitude ?? null,
    speed: row.speed ?? null,
    status,
    fuelLevel: row.fuelLevel ?? row.primaryFuelLevel ?? null,
    odometer: row.odometer ?? null,
    lastSeenAt: row.lastSeenAt ?? row.eventDateTime ?? null,
    isStale: Boolean(row.isStale),
  };
}

export default toGeofenceLiveVehicle;
