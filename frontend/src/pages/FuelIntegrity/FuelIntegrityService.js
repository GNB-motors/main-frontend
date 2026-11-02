import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';
import { parseSafe } from '../../schemas/validate.js';
import { normaliseWindowsPayload } from './fuelWindows.js';

/** The schema module is loaded on demand so zod stays out of the main chunk. */
const importFuelIntegrityV2 = () => import('../../schemas/mileageV2.schema.js');

/**
 * Service functions for the Fuel Integrity owner screens.
 * All ₹ figures returned by these endpoints are estimates.
 */
export const FuelIntegrityService = {
  /**
   * Paginated detected-fill feed.
   * @param {object} params - { vehicle, from, to, page, limit }
   */
  getFills: async (params = {}, signal) => {
    try {
      const response = await apiClient.get(`/api/fuel-integrity/fills`, { params, signal });
      return response.data?.data || {};
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
      throw ApiError.from(error);
    }
  },

  /**
   * Mass-balance window feed (one row per window, with its check).
   *
   * The contract re-shaped this endpoint, so the answer is parsed with the
   * contract schema and mapped onto the envelope the page already reads.
   * @param {object} params - { vehicle, from, to }
   */
  getWindows: async (params = {}, signal) => {
    try {
      const response = await apiClient.get(`/api/fuel-integrity/windows`, { params, signal });
      const body = normaliseWindowsPayload(response.data?.data || {});
      return await parseSafe('FuelIntegrityResponseSchema', importFuelIntegrityV2, body);
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
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
      throw ApiError.from(error);
    }
  },
};
