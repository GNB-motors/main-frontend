import apiClient from '../../utils/axiosConfig';

/**
 * Service for the Refuel Advisory (feature #16). Same OWNER/MANAGER + per-org
 * feature-flag gate as the other Kaaran surfaces, enforced server-side.
 */
export const RefuelAdvisoryService = {
  /**
   * @param {object} params - { status: 'OK'|'REFUEL_SOON'|'CRITICAL', limit }
   */
  getAdvisories: async (params = {}, signal) => {
    try {
      const response = await apiClient.get('/api/refuel-advisory', { params, signal });
      return response.data || {};
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
      throw error.response?.data || { detail: 'Could not fetch refuel advisories.' };
    }
  },
};
