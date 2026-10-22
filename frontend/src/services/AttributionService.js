/**
 * Attribution card API client.
 *
 * One card, three entry points, one backend module — a vehicle, a driver, and
 * one closed mileage cycle (what a MILEAGE_BELOW_EXPECTED alert opens). All
 * three return the same shape, so the card component is mounted once and reused.
 *
 * Uses the shared apiClient so every call inherits Authorization + X-Org-Id
 * (+ X-Branch-Id when a branch is active).
 */
import apiClient from '../utils/axiosConfig';

const unwrap = (res) => res.data?.data || res.data;

const AttributionService = {
  /** The card for a vehicle, e.g. on Vehicle360. */
  forVehicle: async (vehicleId, params = {}, { signal } = {}) => {
    const response = await apiClient.get(`/api/attribution/vehicles/${vehicleId}`, {
      params,
      signal,
    });
    return unwrap(response);
  },

  /** The card for a driver, e.g. on the driver profile. */
  forDriver: async (driverId, params = {}, { signal } = {}) => {
    const response = await apiClient.get(`/api/attribution/drivers/${driverId}`, {
      params,
      signal,
    });
    return unwrap(response);
  },

  /** The card for one closed full-tank cycle — what a mileage alert opens. */
  forInterval: async (intervalId, { signal } = {}) => {
    const response = await apiClient.get(`/api/attribution/intervals/${intervalId}`, { signal });
    return unwrap(response);
  },
};

export default AttributionService;