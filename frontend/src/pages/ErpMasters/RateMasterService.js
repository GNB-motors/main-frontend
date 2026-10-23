/**
 * Rate Master - API Integration Layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/masters/rates';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const RateMasterService = {
  getRates: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch rates');
    }
  },

  /**
   * Resolve the rate in force. Responds 200 with { found: false } when nothing
   * matches — that is a normal branch, not an error.
   */
  lookupRate: async ({ partyId, routeId, material, onDate }) => {
    try {
      const response = await apiClient.get(`${BASE}/lookup`, {
        params: { partyId, routeId, material, ...(onDate ? { onDate } : {}) },
      });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to look up rate');
    }
  },

  createRate: async (data) => {
    try {
      const response = await apiClient.post(BASE, data);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to create rate');
    }
  },

  updateRate: async (rateId, data) => {
    try {
      const response = await apiClient.patch(`${BASE}/${rateId}`, data);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to update rate');
    }
  },

  deactivateRate: async (rateId) => {
    try {
      const response = await apiClient.delete(`${BASE}/${rateId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to deactivate rate');
    }
  },
};

export default RateMasterService;
