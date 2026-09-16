import apiClient from '../../utils/axiosConfig';

/**
 * Service functions for the Daily Brief (per-org morning intelligence brief).
 * Dark-launch: 404s for orgs without the `dailyBrief` feature flag or a
 * non-OWNER/MANAGER role — that is enforced server-side, not here.
 */
export const DailyBriefService = {
  /**
   * @param {object} params - { date } — YYYY-MM-DD, any instant within the target IST day
   */
  getBrief: async (params = {}, signal) => {
    try {
      const response = await apiClient.get(`/api/daily-brief`, { params, signal });
      return response.data?.data || {};
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
      console.error('API Error fetching daily brief:', error.response?.data || error.message);
      throw error.response?.data || { detail: 'Could not fetch the daily brief.' };
    }
  },
};
