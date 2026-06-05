import apiClient from '../../utils/axiosConfig';

/**
 * Read API for the Field Agent Fuel Uploads page (separate from the existing fuel/mileage screens).
 */
export const FieldAgentFuelService = {
  /**
   * @param {{ vehicleId?: string, from?: string, to?: string, page?: number, limit?: number }} params
   * @returns {Promise<{ status, data, meta, stats }>}
   */
  getLogs: async (params = {}) => {
    const res = await apiClient.get('/api/field-agent/fuel-logs/all-fuel-logs', { params });
    return res.data;
  },

  /** Vehicles for the filter dropdown. */
  getVehicles: async () => {
    const res = await apiClient.get('/api/field-agent/fuel-logs/all-vehicles');
    const data = res.data?.data ?? res.data ?? [];
    return Array.isArray(data) ? data : [];
  },

  /** Drivers for the upload modal. */
  getDrivers: async () => {
    const res = await apiClient.get('/api/field-agent/fuel-logs/all-drivers');
    const data = res.data?.data ?? res.data ?? [];
    return Array.isArray(data) ? data : [];
  },

  /** Upload fuel log photo */
  uploadFuelPhoto: async (formData, orgId) => {
    const res = await apiClient.post('/api/mileage/fuel-log/from-photo', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'X-Org-Id': orgId
      },
    });
    return res.data;
  },
};
