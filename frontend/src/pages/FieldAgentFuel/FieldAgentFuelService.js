import apiClient from '../../utils/axiosConfig';

const isFieldAgent = () => localStorage.getItem('user_role') === 'FIELD_AGENT';

const unwrapList = (res) => {
  const data = res.data?.data ?? res.data ?? [];
  return Array.isArray(data) ? data : [];
};

/**
 * Read API for the Field Agent Fuel Uploads page (separate from the existing fuel/mileage screens).
 * Field agents use cross-org `/all-*` routes; owners/managers use org-scoped routes.
 */
export const FieldAgentFuelService = {
  /**
   * @param {{ vehicleId?: string, from?: string, to?: string, page?: number, limit?: number }} params
   * @returns {Promise<{ status, data, meta, stats }>}
   */
  getLogs: async (params = {}) => {
    const path = isFieldAgent()
      ? '/api/field-agent/fuel-logs/all-fuel-logs'
      : '/api/field-agent/fuel-logs';
    const res = await apiClient.get(path, { params });
    return res.data;
  },

  /** Vehicles for the filter dropdown. */
  getVehicles: async () => {
    if (isFieldAgent()) {
      const res = await apiClient.get('/api/field-agent/fuel-logs/all-vehicles');
      return unwrapList(res);
    }
    const res = await apiClient.get('/api/vehicles', { params: { limit: 500 } });
    return unwrapList(res);
  },

  /** Drivers for the upload modal. */
  getDrivers: async () => {
    if (isFieldAgent()) {
      const res = await apiClient.get('/api/field-agent/fuel-logs/all-drivers');
      return unwrapList(res);
    }
    const res = await apiClient.get('/api/employees', { params: { role: 'DRIVER', limit: 500 } });
    return unwrapList(res);
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
