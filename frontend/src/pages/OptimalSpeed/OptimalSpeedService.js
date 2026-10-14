import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';

/**
 * Service for the Optimal-Speed Advisory (feature #15). Same OWNER/MANAGER +
 * per-org feature-flag gate as the other Kaaran surfaces, enforced server-side.
 */
export const OptimalSpeedService = {
  /**
   * @param {object} params - { sort: 'savings'|'efficiency', limit }
   */
  getProfiles: async (params = {}, signal) => {
    try {
      const response = await apiClient.get('/api/optimal-speed', { params, signal });
      return response.data || {};
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
      throw ApiError.from(error);
    }
  },
};
