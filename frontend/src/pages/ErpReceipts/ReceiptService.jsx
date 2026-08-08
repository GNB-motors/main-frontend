/**
 * Receipt entry & adjustment (ISOCL ERP Stage 12) — API layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/receipts';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const ReceiptApi = {
  create: async (body) => {
    try {
      const response = await apiClient.post(BASE, body);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to record receipt');
    }
  },

  list: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch receipts');
    }
  },

  listUnadjusted: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/unadjusted`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch unadjusted receipts');
    }
  },

  getAdjustmentContext: async (voucherId) => {
    try {
      const response = await apiClient.get(`${BASE}/${voucherId}/adjustment-context`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to load adjustment context');
    }
  },

  createAdjustment: async (body) => {
    try {
      const response = await apiClient.post(`${BASE}/adjustments`, body);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to post adjustment');
    }
  },

  listAdjustments: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/adjustments`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch adjustments');
    }
  },

  reverseAdjustment: async (id, reason) => {
    try {
      const response = await apiClient.post(`${BASE}/adjustments/${id}/reverse`, { reason });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to reverse adjustment');
    }
  },

  shortageDetentionReport: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/reports/shortage-detention`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch shortage/detention report');
    }
  },

  exportReportCsv: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/reports/shortage-detention`, {
        params: { ...params, format: 'csv' },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to export report');
    }
  },
};

export default ReceiptApi;
