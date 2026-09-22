import apiClient from '../../utils/axiosConfig';

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
  getPositions: async (params = {}) => {
    try {
      const response = await apiClient.get(`/api/livetracking/positions`, { params });
      return response.data?.data?.records || [];
    } catch (error) {
      console.error('API Error fetching live positions:', error.response?.data || error.message);
      throw error.response?.data || { detail: 'Could not fetch live positions.' };
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
      console.error('API Error fetching vehicle trail:', error.response?.data || error.message);
      throw error.response?.data || { detail: 'Could not fetch the vehicle trail.' };
    }
  },

  /**
   * Road-followed, speed-graded trail for one vehicle. Segments carry road
   * distance, speed and an OVERSPEED/NORMAL/SLOW grade; estimated km are
   * reported separately from measured km.
   */
  getRoadTrail: async (reg, params = {}) => {
    try {
      const response = await apiClient.get(`/api/road-snap/trail/${encodeURIComponent(reg)}`, {
        params,
      });
      return response.data?.data || {};
    } catch (error) {
      console.error('API Error fetching road trail:', error.response?.data || error.message);
      throw error.response?.data || { detail: 'Could not fetch the road-followed trail.' };
    }
  },

  /** Saved, classified stop hotspots (toll/warehouse/company/parking) for the org. */
  getHotspots: async (params = {}) => {
    try {
      const response = await apiClient.get(`/api/road-snap/hotspots`, { params });
      return response.data?.data?.records || [];
    } catch (error) {
      console.error('API Error fetching hotspots:', error.response?.data || error.message);
      return [];
    }
  },

  /** Detect + classify >15 min stops for one vehicle in the current window (paid, explicit). */
  refreshHotspots: async (reg, params = {}) => {
    try {
      const response = await apiClient.post(
        `/api/road-snap/hotspots/${encodeURIComponent(reg)}/refresh`,
        null,
        { params },
      );
      return response.data?.data || {};
    } catch (error) {
      console.error('API Error refreshing hotspots:', error.response?.data || error.message);
      throw error.response?.data || { detail: 'Could not refresh hotspots.' };
    }
  },

  /** Month-to-date map spend + OSM savings for the cost dashboard. */
  getMapCost: async () => {
    try {
      const response = await apiClient.get(`/api/road-snap/cost`);
      return response.data?.data || {};
    } catch (error) {
      console.error('API Error fetching map cost:', error.response?.data || error.message);
      return {};
    }
  },
};
