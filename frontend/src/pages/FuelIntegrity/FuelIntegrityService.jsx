import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';

/**
 * Service functions for the Fuel Integrity owner screens.
 * All ₹ figures returned by these endpoints are estimates.
 */
export const FuelIntegrityService = {
  /**
   * Paginated detected-fill feed.
   * @param {object} params - { vehicle, from, to, page, limit }
   */
  getFills: async (params = {}) => {
    try {
      const response = await apiClient.get(`/api/fuel-integrity/fills`, { params });
      return response.data?.data || {};
    } catch (error) {
      console.error('API Error fetching fuel fills:', error.response?.data || error.message);
      throw ApiError.from(error);
    }
  },

  /**
   * Mass-balance window feed (siphon suspects + DEF ratio).
   * @param {object} params - { vehicle, from, to }
   */
  getWindows: async (params = {}) => {
    try {
      const response = await apiClient.get(`/api/fuel-integrity/windows`, { params });
      return response.data?.data || {};
    } catch (error) {
      console.error(
        'API Error fetching fuel integrity windows:',
        error.response?.data || error.message,
      );
      throw ApiError.from(error);
    }
  },

  /**
   * Per-vehicle rollup for the summary strip.
   * @param {object} params - { from, to }
   */
  getSummary: async (params = {}, signal) => {
    try {
      const response = await apiClient.get(`/api/fuel-integrity/summary`, { params, signal });
      return response.data?.data || {};
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
      console.error(
        'API Error fetching fuel integrity summary:',
        error.response?.data || error.message,
      );
      throw ApiError.from(error);
    }
  },

  /**
   * Pump short-delivery ledger (#7): per-pump rollup of reconciled fills.
   * @param {object} params - { from, to }
   */
  getPumpLedger: async (params = {}, { signal } = {}) => {
    try {
      const response = await apiClient.get(`/api/fuel-integrity/pump-ledger`, { params, signal });
      return response.data?.data || {};
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
      console.error('API Error fetching pump ledger:', error.response?.data || error.message);
      throw ApiError.from(error);
    }
  },

  /**
   * Refuel advisory (#16) for one vehicle: derived range + honest pumps.
   * @param {object} params - { vehicle }
   */
  getRefuelAdvisory: async (params = {}, { signal } = {}) => {
    try {
      const response = await apiClient.get(`/api/fuel-integrity/refuel-advisory`, {
        params,
        signal,
      });
      return response.data?.data || {};
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
      console.error('API Error fetching refuel advisory:', error.response?.data || error.message);
      throw ApiError.from(error);
    }
  },

  /**
   * On-demand trigger to reconcile recent FleetEdge telemetry.
   */
  triggerSync: async () => {
    try {
      const response = await apiClient.post(`/api/fuel-integrity/sync`);
      return response.data?.data || {};
    } catch (error) {
      console.error(
        'API Error triggering fuel integrity sync:',
        error.response?.data || error.message,
      );
      throw ApiError.from(error);
    }
  },
};
