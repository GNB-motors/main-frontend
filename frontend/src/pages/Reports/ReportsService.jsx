import apiClient from '../../utils/axiosConfig'; // Use the configured axios instance
import dayjs from 'dayjs'; // Import dayjs for date formatting

/**
 * Service functions for fetching report data.
 */
export const ReportsService = {
    /**
     * Fetches trip reports.
     * @param {object} params - Optional query parameters { page, limit }.
     * @returns {Promise<Array>} - Array of trip data.
     */
    getTripReports: async (params = {}) => {
        try {
            // Call the new endpoint: /reports/trips
            const response = await apiClient.get(`api/reports/trips`, { params });
            
            // Extract the data array from the response
            // Response structure: { status: "success", data: [...], meta: {...} }
            if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
                console.log('Trip Reports Meta:', response.data.meta);
                return response.data.data; // Return the data array
            }
            
            // Fallback if structure is different
            return response.data?.data || [];
        } catch (error) {
            console.error("API Error fetching trip reports:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable while fetching trip reports." };
        }
    },

    /**
     * Fetches aggregated vehicle report data.
     * @param {object} params - Optional query parameters { page, limit }.
     * @returns {Promise<Array>} - Array of vehicle report data.
     */
    getVehicleReports: async (params = {}) => {
        try {
            // Call the new endpoint: /reports/vehicles
            const response = await apiClient.get(`api/reports/vehicles`, { params });
            
            // Extract the data array from the response
            // Response structure: { status: "success", data: [...], meta: {...} }
            if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
                console.log('Vehicle Reports Meta:', response.data.meta);
                return response.data.data; // Return the data array
            }
            
            // Fallback if structure is different
            return response.data?.data || [];
        } catch (error) {
            console.error("API Error fetching vehicle reports:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable while fetching vehicle reports." };
        }
    },

    /**
     * Fetches outlier trip reports with optional date filtering.
     * @param {object} filters - Optional filters { startDate: dayjsObject | null, endDate: dayjsObject | null }.
     */
    getOutlierReports: async (filters = {}) => {
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

            // Call the new backend endpoint with optional params (removed businessRefId dependency)
            const response = await apiClient.get(`/api/v1/reports/outliers`, { params });
            // Ensure response.data is always an array
            return response.data || [];
        } catch (error) {
            console.error("API Error fetching outlier reports:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable while fetching outlier reports." };
        }
    },
    /**
     * Fetches aggregated driver report data.
     * @param {object} params - Optional query parameters { page, limit }.
     * @returns {Promise<Array>} - Array of driver report data.
     */
    getDriverReports: async (params = {}) => {
        try {
            // Call the new endpoint: /reports/drivers
            const response = await apiClient.get(`api/reports/drivers`, { params });
            
            // Extract the data array from the response
            // Response structure: { status: "success", data: [...], meta: {...} }
            if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
                console.log('Driver Reports Meta:', response.data.meta);
                return response.data.data; // Return the data array
            }
            
            // Fallback if structure is different
            return response.data?.data || [];
        } catch (error) {
            console.error("API Error fetching driver reports:", error.response?.data || error.message);
            throw error.response?.data || { detail: "Network error or server unavailable while fetching driver reports." };
        }
    },
};