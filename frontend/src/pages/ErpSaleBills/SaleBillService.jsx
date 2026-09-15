/**
 * Sale bill making (ISOCL ERP Stage 9) — API layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/sale-bills';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const SaleBillApi = {
  getPending: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/pending`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch pending billing');
    }
  },

  list: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to list sale bills');
    }
  },

  getById: async (billId) => {
    try {
      const response = await apiClient.get(`${BASE}/${billId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch sale bill');
    }
  },

  create: async (payload) => {
    try {
      const response = await apiClient.post(BASE, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to create sale bill');
    }
  },

  print: async (billId) => {
    try {
      const response = await apiClient.get(`${BASE}/${billId}/print`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to load print data');
    }
  },

  cancel: async (billId, reason) => {
    try {
      const response = await apiClient.post(`${BASE}/${billId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to cancel sale bill');
    }
  },

  getPendingSubmission: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/pending-submission`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch pending submission');
    }
  },

  submit: async (billId, payload) => {
    try {
      const response = await apiClient.post(`${BASE}/${billId}/submit`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to submit bill');
    }
  },

  markReceived: async (billId, payload) => {
    try {
      const response = await apiClient.post(`${BASE}/${billId}/received`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to mark received');
    }
  },
};

export default SaleBillApi;
