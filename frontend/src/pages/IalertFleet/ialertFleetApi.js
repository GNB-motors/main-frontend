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
