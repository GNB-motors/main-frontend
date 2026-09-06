import apiClient from '../../utils/axiosConfig';

const unwrapList = (res) => {
  const data = res.data?.data ?? res.data ?? [];
  return Array.isArray(data) ? data : [];
};

/**
 * Read API for the Overspeed page (audit §3) — sustained overspeed events
 * recomputed from position history, with FleetEdge alerts as corroboration.
 */
export const OverspeedService = {
  /**
   * @param {{ vehicleId: string, from: string, to: string, speedKmh: number, durationSec: number }} params
   * @returns {Promise<{ events, corroborating, thresholdsUsed, pingCount, dataState, computedAt, from, to, registrationNumber }>}
   * @throws {ApiError} 422 = no position pings in the window (missing data,
   *   NOT zero events), 400 = bad params, 404 = vehicle not in org.
   */
  getEvents: async (params = {}) => {
    const res = await apiClient.get('/api/overspeed/events', { params });
    return res.data?.data ?? {};
  },

  /** Vehicles for the picker. */
  getVehicles: async () => {
    const res = await apiClient.get('/api/vehicles', { params: { limit: 500 } });
    return unwrapList(res);
  },
};
