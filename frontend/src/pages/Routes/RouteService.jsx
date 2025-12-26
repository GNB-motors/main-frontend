/**
 * Route Service - API Integration Layer
 * Handles all route-related API calls
 */

import apiClient from '../../utils/axiosConfig';

const RouteService = {
  /**
   * Get all routes with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (1-indexed)
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Search query for route name/city
   * @param {string} params.status - Filter by status (ACTIVE/INACTIVE)
   * @returns {Promise<Object>} Routes list with pagination info
   */
  getRoutes: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/routes', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch routes:', error.response?.data || error.message);
      // Return mock data for development if endpoint doesn't exist
      if (error.response?.status === 500 || error.response?.status === 404) {
        console.warn('Routes endpoint not available, returning empty list');
        return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      }
      throw error.response?.data || error;
    }
  },

  /**
   * Get a single route by ID
   * @param {string} id - Route ID
   * @returns {Promise<Object>} Route object
   */
  getRouteById: async (id) => {
    try {
      const response = await apiClient.get(`/api/routes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch route:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Create a new route
   * @param {Object} data - Route data (backend format)
   * @returns {Promise<Object>} Created route object
   */
  createRoute: async (data) => {
    try {
      const response = await apiClient.post('/api/routes', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create route:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Update an existing route
   * @param {string} id - Route ID
   * @param {Object} data - Updated route data (backend format)
   * @returns {Promise<Object>} Updated route object
   */
  updateRoute: async (id, data) => {
    try {
      const response = await apiClient.patch(`/api/routes/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update route:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Update route status (toggle ACTIVE/INACTIVE)
   * @param {string} id - Route ID
   * @param {string} status - New status (ACTIVE or INACTIVE)
   * @returns {Promise<Object>} Updated route object
   */
  updateRouteStatus: async (id, status) => {
    try {
      const response = await apiClient.patch(`/api/routes/${id}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update route status:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete a route
   * @param {string} id - Route ID
   * @returns {Promise<Object>} Deleted route object
   */
  deleteRoute: async (id) => {
    try {
      const response = await apiClient.delete(`/api/routes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete route:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

export default RouteService;
