import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';

/**
 * Service for the Driving DNA (mini) surface (feature #3). Same OWNER/MANAGER +
 * per-org feature-flag gate as the other Kaaran surfaces, enforced server-side.
 */
export const DrivingDnaService = {
  /**
   * @param {object} params - { limit }
   */
  getProfiles: async (params = {}, signal) => {
    try {
      const response = await apiClient.get('/api/driving-dna', { params, signal });
      return response.data || {};
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
      throw ApiError.from(error);
    }
  },
};
