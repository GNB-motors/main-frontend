import apiClient from '../../../utils/axiosConfig';

class WeightSlipTripService {
  /**
   * Get weight slip trip by ID
   * @param {string} id - Weight slip trip ID
   * @returns {Promise} API response with weight slip trip data
   */
  static async getById(id) {
    try {
      const response = await apiClient.get(`/api/weight-slip-trips/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch weight slip trip:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get all weight slip trips for a journey
   * @param {string} journeyId - Journey (Trip) ID
   * @returns {Promise} API response with array of weight slip trips
   */
  static async getByJourneyId(journeyId) {
    try {
      const response = await apiClient.get(`/api/weight-slip-trips/journey/${journeyId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch weight slip trips by journey:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get completion statistics for a journey
   * @param {string} journeyId - Journey (Trip) ID
   * @returns {Promise} API response with completion stats
   */
  static async getCompletionStats(journeyId) {
    try {
      const response = await apiClient.get(`/api/weight-slip-trips/journey/${journeyId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch completion stats:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get all weight slip trips with filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Filter by status
   * @param {string} params.materialType - Filter by material type
   * @param {string} params.journeyId - Filter by journey ID
   * @returns {Promise} API response with paginated results
   */
  static async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.materialType) queryParams.append('materialType', params.materialType);
      if (params.journeyId) queryParams.append('journeyId', params.journeyId);

      const response = await apiClient.get(`/api/weight-slip-trips?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch weight slip trips:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Update weight slip trip (only for non-submitted trips)
   * @param {string} id - Weight slip trip ID
   * @param {Object} updateData - Data to update
   * @returns {Promise} API response with updated trip
   */
  static async update(id, updateData) {
    try {
      const response = await apiClient.patch(`/api/weight-slip-trips/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update weight slip trip:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Delete weight slip trip (only for non-submitted trips, admin only)
   * @param {string} id - Weight slip trip ID
   * @returns {Promise} API response
   */
  static async delete(id) {
    try {
      const response = await apiClient.delete(`/api/weight-slip-trips/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete weight slip trip:', error);
      throw error.response?.data || error;
    }
  }
}

export default WeightSlipTripService;
