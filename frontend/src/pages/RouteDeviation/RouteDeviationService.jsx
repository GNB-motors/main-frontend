import apiClient from '../../utils/axiosConfig';

/**
 * Service functions for the Route Deviation owner screen.
 * Cost figures are estimates; flags mean please review.
 */
export const RouteDeviationService = {
    /**
     * Paginated deviation events (OPEN first).
     * @param {object} params - { vehicle, from, to, page, limit }
     */
    getEvents: async (params = {}) => {
        try {
            const response = await apiClient.get(`/api/route-deviation/events`, { params });
            return response.data?.data || {};
        } catch (error) {
            console.error("API Error fetching route deviation events:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not fetch route deviation events." };
        }
    },

    /**
     * Mark an event reviewed.
     * @param {string} id - RouteDeviationEvent id
     */
    reviewEvent: async (id) => {
        try {
            const response = await apiClient.put(`/api/route-deviation/events/${id}/review`);
            return response.data?.data || {};
        } catch (error) {
            console.error("API Error reviewing route deviation event:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Could not mark the event reviewed." };
        }
    },
};
