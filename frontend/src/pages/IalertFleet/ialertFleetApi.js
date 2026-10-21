import apiClient from '../../utils/axiosConfig';

/** GET api/extension/ialert/vehicles → { vehicleCount, firstPullPending, vehicles[] }. */
export async function fetchIalertVehicles(signal) {
  const res = await apiClient.get('api/extension/ialert/vehicles', { signal });
  const data = res.data?.data || {};
  return {
    vehicleCount: data.vehicleCount ?? 0,
    firstPullPending: Boolean(data.firstPullPending),
    vehicles: Array.isArray(data.vehicles) ? data.vehicles : [],
  };
}

/**
 * POST api/extension/ialert/add-to-fleet — create (or tag) the fleet Vehicle for
 * one iALERT master row, keyed by VIN. Idempotent: an already-linked vehicle
 * comes back with { status: 'skipped', reason: 'already_tagged' }.
 */
export async function addIalertVehicleToFleet(vin) {
  const res = await apiClient.post('api/extension/ialert/add-to-fleet', { vin });
  return res.data?.data || {};
}
