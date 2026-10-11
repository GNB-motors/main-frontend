/**
 * Outstanding receivables (ISOCL ERP Stage 11) — API layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/sale-bills/outstanding';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const OutstandingApi = {
  getSummary: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/summary`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch outstanding summary');
    }
  },

  getPartyWise: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/party-wise`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch party-wise outstanding');
    }
  },

  list: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch outstanding bills');
    }
  },

  exportCsv: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, {
        params: { ...params, format: 'csv' },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to export outstanding CSV');
    }
  },
};

export default OutstandingApi;
