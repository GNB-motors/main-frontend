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
  return {
    vehicleId: row.registrationNumber || row.vin || null,
    registrationNumber: row.registrationNumber || row.vin || null,
    lat: row.latitude ?? null,
    lng: row.longitude ?? null,
    speed: row.speed ?? null,
    status:
      row.state === 'ACTIVE'
        ? row.ignition === false
          ? 'Idling'
          : 'Moving'
        : row.state === 'PARKED'
          ? 'Stopped'
          : 'Offline',
    fuelLevel: row.primaryFuelLevel ?? null,
    odometer: null,
    lastSeenAt: row.eventDateTime ?? null,
    isStale: Boolean(row.isStale),
  };
}

export default toGeofenceLiveVehicle;
