/**
 * Trip Advances (ISOCL ERP Stage 4) - API Integration Layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/advances';
const MASTERS = '/api/erp/masters';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const AdvanceService = {
  /** Cost an advance without saving. Same code path the submit runs. */
  preview: async ({ tripId, legTypes, requestedAmount, flatAmounts }) => {
    try {
      const response = await apiClient.post(`${BASE}/preview`, {
        tripId,
        ...(legTypes ? { legTypes } : {}),
        ...(requestedAmount != null ? { requestedAmount } : {}),
        ...(flatAmounts ? { flatAmounts } : {}),
      });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to cost the advance');
    }
  },

  requestAdvance: async (payload) => {
    try {
      const response = await apiClient.post(BASE, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to raise the advance');
    }
  },

  getAdvances: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch advances');
    }
  },

  getAdvanceById: async (advanceId) => {
    try {
      const response = await apiClient.get(`${BASE}/${advanceId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch the advance');
    }
  },

  pay: async (advanceId, { paymentMode, paymentRef }) => {
    try {
      const response = await apiClient.post(`${BASE}/${advanceId}/pay`, {
        paymentMode,
        ...(paymentRef ? { paymentRef } : {}),
      });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to record the payment');
    }
  },

  cancel: async (advanceId, reason) => {
    try {
      const response = await apiClient.post(`${BASE}/${advanceId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to cancel the advance');
    }
  },

  // ─── Recoveries ───────────────────────────────────────────────────────────
  getRecoveries: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/recoveries`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch recoveries');
    }
  },

  createRecovery: async (payload) => {
    try {
      const response = await apiClient.post(`${BASE}/recoveries`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to record the recovery');
    }
  },

  // ─── Advance masters ──────────────────────────────────────────────────────
  getMileage: async (params = {}) => {
    try {
      const response = await apiClient.get(`${MASTERS}/mileage`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch mileage');
    }
  },

  saveMileage: async (payload) => {
    try {
      const response = await apiClient.post(`${MASTERS}/mileage`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to save mileage');
    }
  },

  deleteMileage: async (id) => {
    try {
      const response = await apiClient.delete(`${MASTERS}/mileage/${id}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to delete mileage');
    }
  },

  getFuelRates: async (params = {}) => {
    try {
      const response = await apiClient.get(`${MASTERS}/fuel-rates`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch fuel rates');
    }
  },

  saveFuelRate: async (payload) => {
    try {
      const response = await apiClient.post(`${MASTERS}/fuel-rates`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to save the fuel rate');
    }
  },

  deleteFuelRate: async (id) => {
    try {
      const response = await apiClient.delete(`${MASTERS}/fuel-rates/${id}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to delete the fuel rate');
    }
  },

  getRouteBudgets: async (params = {}) => {
    try {
      const response = await apiClient.get(`${MASTERS}/route-budgets`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch route budgets');
    }
  },

  saveRouteBudget: async (payload) => {
    try {
      const response = await apiClient.post(`${MASTERS}/route-budgets`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to save the route budget');
    }
  },

  deleteRouteBudget: async (id) => {
    try {
      const response = await apiClient.delete(`${MASTERS}/route-budgets/${id}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to delete the route budget');
    }
  },
};

export default AdvanceService;
