/**
 * Ledger foundation (ISOCL ERP) — API layer
 */

import apiClient from '../../utils/axiosConfig';

const LEDGER = '/api/erp/ledger';
const VOUCHERS = '/api/erp/vouchers';
const SUPPLIERS = '/api/erp/masters/suppliers';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const LedgerApi = {
  getStatement: async (params = {}) => {
    try {
      const response = await apiClient.get(`${LEDGER}/statement`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch statement');
    }
  },

  getBalance: async (params = {}) => {
    try {
      const response = await apiClient.get(`${LEDGER}/balance`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch balance');
    }
  },

  postOpening: async (payload) => {
    try {
      const response = await apiClient.post(`${LEDGER}/opening`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to post opening balance');
    }
  },

  getVouchers: async (params = {}) => {
    try {
      const response = await apiClient.get(VOUCHERS, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch vouchers');
    }
  },

  createVoucher: async (payload) => {
    try {
      const response = await apiClient.post(VOUCHERS, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to create voucher');
    }
  },

  getSuppliers: async (params = {}) => {
    try {
      const response = await apiClient.get(SUPPLIERS, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch suppliers');
    }
  },

  createSupplier: async (payload) => {
    try {
      const response = await apiClient.post(SUPPLIERS, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to create supplier');
    }
  },
};

export default LedgerApi;
