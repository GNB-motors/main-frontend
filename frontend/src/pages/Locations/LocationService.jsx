/**
 * Location Service - API Integration Layer
 * Handles all location-related API calls
 */

import apiClient from '../../utils/axiosConfig';

const LocationService = {
    /**
     * Get all locations with pagination and filtering
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (1-indexed)
     * @param {number} params.limit - Items per page
     * @param {string} params.search - Search query for name
     * @param {string} params.type - Filter by type (SOURCE/DESTINATION)
     * @returns {Promise<Object>} Locations list
     */
    getLocations: async (params = {}) => {
        try {
            const response = await apiClient.get('/api/locations', { params });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch locations:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    /**
     * Get a single location by ID
     * @param {string} id - Location ID
     * @returns {Promise<Object>} Location object
     */
    getLocationById: async (id) => {
        try {
            const response = await apiClient.get(`/api/locations/${id}`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch location:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    /**
     * Create a new location
     * @param {Object} data - Location data
     * @returns {Promise<Object>} Created location object
     */
    createLocation: async (data) => {
        try {
            const response = await apiClient.post('/api/locations', data);
            return response.data;
        } catch (error) {
            console.error('Failed to create location:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    /**
     * Update an existing location
     * @param {string} id - Location ID
     * @param {Object} data - Updated location data
     * @returns {Promise<Object>} Updated location object
     */
    updateLocation: async (id, data) => {
        try {
            const response = await apiClient.patch(`/api/locations/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Failed to update location:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    /**
     * Delete a location
     * @param {string} id - Location ID
     * @returns {Promise<Object>} Success response
     */
    deleteLocation: async (id) => {
        try {
            const response = await apiClient.delete(`/api/locations/${id}`);
            return response.data;
        } catch (error) {
            console.error('Failed to delete location:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

export default LocationService;
