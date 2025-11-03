import apiClient from '../../utils/axiosConfig'; // Use the configured axios instance
import dayjs from 'dayjs'; // Import dayjs for date formatting

/**
 * Service functions for fetching report data.
 */
export const ReportsService = {
    /**
     * Fetches trip reports for a given business reference ID.
     */
    getTripReports: async (businessRefId) => {
        if (!businessRefId) {
            throw new Error("Business Reference ID is required to fetch trip reports.");
        }
        try {
            const response = await apiClient.get(`/api/v1/reports/${businessRefId}/trips`);
            return response.data || [];
        } catch (error) {
            console.error("API Error fetching trip reports:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable while fetching trip reports." };
        }
    },

    /**
     * Fetches aggregated vehicle report data (from summary table)
     * for a given business reference ID.
     */
    getVehicleReports: async (businessRefId) => {
         if (!businessRefId) {
            throw new Error("Business Reference ID is required to fetch vehicle reports.");
        }
        try {
            const response = await apiClient.get(`/api/v1/reports/${businessRefId}/vehicles`);
            return response.data || [];
        } catch (error) {
            console.error("API Error fetching vehicle reports:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable while fetching vehicle reports." };
        }
    },

    /**
     * Fetches outlier trip reports for a given business reference ID,
     * with optional date filtering.
     * @param {string} businessRefId - The business reference ID.
     * @param {object} filters - Optional filters { startDate: dayjsObject | null, endDate: dayjsObject | null }.
     */
    getOutlierReports: async (businessRefId, filters = {}) => {
        if (!businessRefId) {
            throw new Error("Business Reference ID is required to fetch outlier reports.");
        }
        try {
            // Prepare query parameters for dates if they exist
            const params = {};
            if (filters.startDate && dayjs(filters.startDate).isValid()) {
                // Backend expects 'start_date' and 'end_date' based on route definition
                params.start_date = filters.startDate.format('YYYY-MM-DD');
            }
            if (filters.endDate && dayjs(filters.endDate).isValid()) {
                params.end_date = filters.endDate.format('YYYY-MM-DD');
            }

            // Call the new backend endpoint with optional params
            const response = await apiClient.get(`/api/v1/reports/${businessRefId}/outliers`, { params });
            // Ensure response.data is always an array
            return response.data || [];
        } catch (error) {
            console.error("API Error fetching outlier reports:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable while fetching outlier reports." };
        }
    },
    /**
     * Fetches aggregated driver report data (from driver_reports table)
     * for a given business reference ID.
     */
    getDriverReports: async (businessRefId) => {
        if (!businessRefId) {
            throw new Error("Business Reference ID is required to fetch driver reports.");
        }
        try {
            const response = await apiClient.get(`/api/v1/reports/${businessRefId}/drivers`);
            // Ensure response.data is always an array
            return response.data || [];
        } catch (error) {
            console.error("API Error fetching driver reports:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable while fetching driver reports." };
        }
    },
};