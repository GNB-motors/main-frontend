import apiClient from '../../utils/axiosConfig';

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
            console.error("API Error fetching fuel fills:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch fuel fill events." };
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
            console.error("API Error fetching fuel integrity windows:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch fuel integrity windows." };
        }
    },

    /**
     * Per-vehicle rollup for the summary strip.
     * @param {object} params - { from, to }
     */
    getSummary: async (params = {}) => {
        try {
            const response = await apiClient.get(`/api/fuel-integrity/summary`, { params });
            return response.data?.data || {};
        } catch (error) {
            console.error("API Error fetching fuel integrity summary:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch fuel integrity summary." };
        }
    },
};
