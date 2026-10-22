import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';
import { parseSafe } from '../../schemas/validate.js';

/**
 * Service functions for the Live Tracking map.
 * These are cheap reads over our own DB — the backend cron does the
 * FleetEdge pulling; this page must never trigger a FleetEdge pull itself.
 */
export const LiveTrackingService = {
  /**
   * Latest live position rows for the caller's org.
   * @param {object} params - { state }
   * @returns {Promise<Array>} rows of { registrationNumber, vin, state,
   *   eventDateTime, latitude, longitude, speed, courseDegrees, ignition,
   *   primaryFuelLevel, status, isStale, pulledAt }
   */
  getPositions: async (params = {}, { signal } = {}) => {
    try {
      const response = await apiClient.get(`/api/livetracking/positions`, { params, signal });
      return parseSafe(
        'livePositionListSchema',
        () => import('../../schemas/livePosition.schema.js'),
        response.data?.data?.records || [],
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /**
   * Ordered breadcrumb trail (oldest-first) for one vehicle.
   * @param {string} reg - vehicle registration number
   * @param {object} params - { from, to, limit }
   * @returns {Promise<object>} { registrationNumber, from, to, points }
   */
  getTrail: async (reg, params = {}) => {
    try {
      const response = await apiClient.get(
        `/api/livetracking/positions/${encodeURIComponent(reg)}/trail`,
        { params },
      );
      return response.data?.data || {};
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /**
   * Predicted destination "intents" for vehicles that moved in the last 30 min
   * (OWNER/MANAGER; behind the autoTrips flag). Returns an array of intents;
   * the caller picks the one for the selected vehicle.
   * @returns {Promise<Array>} VehicleIntent rows
   */
  getIntents: async ({ signal } = {}) => {
    try {
      const response = await apiClient.get(`/api/live/intents`, { signal });
      const data = response.data?.data ?? response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /**
   * Recurring stationary clusters (depots / regular halts) over a window.
   * Surfaces the "places / hub" layer that the unified Live page overlays
   * alongside the live breadcrumb trail.
   * @param {string} reg - vehicle registration number
   * @param {object} params - { days }
   * @returns {Promise<object>} { records, totalCount, truncated, coveredFrom, coveredTo }
   */
  getHabitualHalts: async (reg, params = {}, { signal } = {}) => {
    try {
      const response = await apiClient.get(
        `/api/livetracking/positions/${encodeURIComponent(reg)}/habitual-halts`,
        { params, signal },
      );
      return response.data?.data || { records: [] };
    } catch (error) {
      throw ApiError.from(error);
    }
  },
};
