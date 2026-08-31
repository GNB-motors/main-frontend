/**
 * Finance module API (ISOCL ERP Stage 15)
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/finance';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  return err;
};

const FinanceApi = {
  createFleetExpense: async (body) => {
    try {
      const response = await apiClient.post(`${BASE}/fleet-expenses`, body);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to create fleet expense');
    }
  },

  listFleetExpenses: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/fleet-expenses`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to list fleet expenses');
    }
  },

  createOthersVoucher: async (body) => {
    try {
      const response = await apiClient.post(`${BASE}/others-vouchers`, body);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to create others voucher');
    }
  },

  createVehiclePaper: async (body) => {
    try {
      const response = await apiClient.post(`${BASE}/vehicle-papers`, body);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to create vehicle paper');
    }
  },

  /** Register list — backend already existed and is branch-scoped. */
  listOthersVouchers: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/others-vouchers`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to list others vouchers');
    }
  },

  /** Register list — backend already existed and is branch-scoped. */
  listVehiclePapers: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/vehicle-papers`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to list vehicle papers');
    }
  },

  getInstalmentDueList: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/instalment-plans/due`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch instalment due list');
    }
  },
};

export default FinanceApi;
