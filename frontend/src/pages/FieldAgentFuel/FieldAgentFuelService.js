import apiClient from '../../utils/axiosConfig';

/**
 * Read API for the Field Agent Fuel Uploads page (separate from the existing fuel/mileage screens).
 */
export const FieldAgentFuelService = {
  /**
   * @param {{ vehicleId?: string, from?: string, to?: string, page?: number, limit?: number }} params
   * @returns {Promise<{ status, data, meta, stats }>}
   */
  getLogs: async ({ vehicleId, from, to, page = 1, limit = 20 } = {}) => {
    const params = { page, limit };
    if (vehicleId) params.vehicleId = vehicleId;
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiClient.get('/api/field-agent/fuel-logs', { params });
    return res.data;
  },

  /** Vehicles for the filter dropdown. */
  getVehicles: async () => {
    const res = await apiClient.get('/api/vehicles');
    const data = res.data?.data ?? res.data ?? [];
    return Array.isArray(data) ? data : [];
  },
};
