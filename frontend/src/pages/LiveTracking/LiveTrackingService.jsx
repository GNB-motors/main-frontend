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
            console.error("API Error fetching live positions:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch live positions." };
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
            const response = await apiClient.get(`/api/livetracking/positions/${encodeURIComponent(reg)}/trail`, { params });
            return response.data?.data || {};
        } catch (error) {
            console.error("API Error fetching vehicle trail:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch the vehicle trail." };
        }
    },
};
