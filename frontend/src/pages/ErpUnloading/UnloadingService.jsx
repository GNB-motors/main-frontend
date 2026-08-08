/**
 * Unloading entry (ISOCL ERP Stage 8) — API layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/unloading';
const PB_BASE = '/api/erp/purchase-bills';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const UnloadingApi = {
  getPending: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/pending`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch pending unloadings');
    }
  },

  calculate: async (payload) => {
    try {
      const response = await apiClient.post(`${BASE}/calculate`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to calculate unloading');
    }
  },

  save: async (payload) => {
    try {
      const response = await apiClient.post(BASE, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to save unloading');
    }
  },

  list: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to list unloadings');
    }
  },

  listPurchaseBills: async (params = {}) => {
    try {
      const response = await apiClient.get(PB_BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to list purchase bills');
    }
  },
};

export default UnloadingApi;
