import apiClient from '../../../utils/axiosConfig';

/**
 * Service functions for the LEMU observability super-admin screen.
 * All endpoints live under /api/lemu and are guarded by SUPER_ADMIN.
 */
export const LemuService = {
    /**
     * Dashboard rollup for the header stats strip.
     */
    getDashboard: async () => {
        try {
            const response = await apiClient.get(`/api/lemu/dashboard`);
            return response.data || {};
        } catch (error) {
            console.error("API Error fetching LEMU dashboard:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch LEMU dashboard." };
        }
    },

    /**
     * Cron/job heartbeat health panel.
     */
    getJobs: async () => {
        try {
            const response = await apiClient.get(`/api/lemu/jobs`);
            return response.data || {};
        } catch (error) {
            console.error("API Error fetching LEMU jobs:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch LEMU job health." };
        }
    },

    /**
     * Paginated event explorer feed.
     * @param {object} params - { severity, layer, source, service, search, since, until, page, limit }
     */
    getEvents: async (params = {}) => {
        try {
            const response = await apiClient.get(`/api/lemu/events`, { params });
            return response.data || {};
        } catch (error) {
            console.error("API Error fetching LEMU events:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch LEMU events." };
        }
    },

    /**
     * Error tracker inbox.
     * @param {object} params - { resolved } ('true' | 'false' | undefined for all)
     */
    getErrorTrackers: async (params = {}) => {
        try {
            const response = await apiClient.get(`/api/lemu/errors`, { params });
            return response.data || {};
        } catch (error) {
            console.error("API Error fetching LEMU error trackers:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch LEMU error trackers." };
        }
    },

    /**
     * Resolve an error tracker by fingerprint.
     * @param {string} fingerprint
     * @param {object} body - { resolvedBy?, notes? }
     */
    resolveError: async (fingerprint, body = {}) => {
        try {
            const response = await apiClient.post(`/api/lemu/errors/${encodeURIComponent(fingerprint)}/resolve`, body);
            return response.data || {};
        } catch (error) {
            console.error("API Error resolving LEMU error tracker:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not resolve the error tracker." };
        }
    },
};
