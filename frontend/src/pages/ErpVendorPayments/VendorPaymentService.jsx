/**
 * Vendor payment (ISOCL ERP Stage 13) — API layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/vendor-payments';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const VendorPaymentApi = {
  /**
   * Released/pending payment history. The endpoint always existed; there was
   * simply no client method, so payment history was unreachable from the UI.
   */
  list: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch vendor payments');
    }
  },

  getOutstanding: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/outstanding`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch outstanding vendor bills');
    }
  },

  checkOnAccount: async (vendorId) => {
    try {
      const response = await apiClient.get(`${BASE}/on-account/${vendorId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to check on-account balance');
    }
  },

  create: async (body) => {
    try {
      const response = await apiClient.post(BASE, body);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to submit vendor payment');
    }
  },

  listPendingRelease: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/pending-release`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch pending release payments');
    }
  },

  release: async (id, body) => {
    try {
      const response = await apiClient.post(`${BASE}/${id}/release`, body);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to release payment');
    }
  },

  retryEmail: async (id) => {
    try {
      const response = await apiClient.post(`${BASE}/${id}/retry-email`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to retry email');
    }
  },
};

export default VendorPaymentApi;
