/**
 * Location Service - API Integration Layer
 * Handles all location-related API calls
 */

import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';

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
      const allowedParams = ['search', 'page', 'limit'];
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(
          ([key, value]) => allowedParams.includes(key) && value !== undefined && value !== '',
        ),
      );
      const response = await apiClient.get('/api/locations', { params: filteredParams });
      return response.data;
    } catch (error) {
      throw ApiError.from(error);
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
      throw ApiError.from(error);
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
      throw ApiError.from(error);
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
      throw ApiError.from(error);
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
      throw ApiError.from(error);
    }
  },
};

export default LocationService;
