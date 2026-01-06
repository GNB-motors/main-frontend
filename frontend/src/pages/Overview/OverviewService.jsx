import apiClient from '../../utils/axiosConfig';

/**
 * Service functions for fetching dashboard overview data.
 */
export const OverviewService = {
    /**
     * Fetches complete dashboard with all metrics
     * @param {object} params - Optional query parameters { days }
     * @returns {Promise<Object>} - Dashboard data
     */
    getDashboardOverview: async (params = {}) => {
        try {
            const response = await apiClient.get(`/api/dashboard/overview`, { params });
            return response.data?.data || response.data || {};
        } catch (error) {
            console.error("API Error fetching dashboard overview:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch dashboard overview." };
        }
    },

    /**
     * Fetches lightweight summary cards only
     * @param {object} params - Optional query parameters { days, startDate, endDate }
     * @returns {Promise<Object>} - Summary data
     */
    getDashboardSummary: async (params = {}) => {
        try {
            const response = await apiClient.get(`/api/dashboard/summary`, { params });
            return response.data?.data || response.data || {};
        } catch (error) {
            console.error("API Error fetching dashboard summary:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch dashboard summary." };
        }
    },

    /**
     * Fetches fleet status breakdown
     * @returns {Promise<Object>} - Fleet status data
     */
    getFleetStatus: async () => {
        try {
            const response = await apiClient.get(`/api/dashboard/fleet`);
            return response.data?.data || response.data || {};
        } catch (error) {
            console.error("API Error fetching fleet status:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch fleet status." };
        }
    },

    /**
     * Fetches fuel variance and outlier data
     * @param {object} params - Optional query parameters { days }
     * @returns {Promise<Object>} - Fuel analytics data
     */
    getFuelAnalytics: async (params = {}) => {
        try {
            const response = await apiClient.get(`/api/dashboard/fuel-analytics`, { params });
            return response.data?.data || response.data || {};
        } catch (error) {
            console.error("API Error fetching fuel analytics:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch fuel analytics." };
        }
    },

    /**
     * Fetches driver performance metrics
     * @param {object} params - Optional query parameters { days }
     * @returns {Promise<Object>} - Driver performance data
     */
    getDriverPerformance: async (params = {}) => {
        try {
            const response = await apiClient.get(`/api/dashboard/driver-performance`, { params });
            return response.data?.data || response.data || {};
        } catch (error) {
            console.error("API Error fetching driver performance:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch driver performance." };
        }
    },

    /**
     * Fetches financial summary and trends
     * @param {object} params - Optional query parameters { days }
     * @returns {Promise<Object>} - Financial data
     */
    getFinancials: async (params = {}) => {
        try {
            const response = await apiClient.get(`/api/dashboard/financials`, { params });
            return response.data?.data || response.data || {};
        } catch (error) {
            console.error("API Error fetching financials:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch financial data." };
        }
    },

    /**
     * Fetches recent activity feed
     * @param {object} params - Optional query parameters
     * @returns {Promise<Array>} - Activity data
     */
    getActivityFeed: async (params = {}) => {
        try {
            const response = await apiClient.get(`/api/dashboard/activity`, { params });
            return response.data?.data || response.data || [];
        } catch (error) {
            console.error("API Error fetching activity:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch activity feed." };
        }
    },
};
