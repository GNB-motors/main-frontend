import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';
import { parseSafe } from '../schemas/validate.js';

/**
 * FleetLinkHealthService — which FleetEdge links need the customer to re-link
 * them from the GNB Edge extension. Org-wide, or the active branch's accounts
 * when X-Branch-Id is set (the axios interceptor adds it).
 */
export const FleetLinkHealthService = {
  async getLinkHealth({ signal } = {}) {
    try {
      const res = await apiClient.get('/api/fleetedge/accounts/link-health', { signal });
      return parseSafe(
        'fleetLinkHealthSchema',
        () => import('../schemas/fleetLinkHealth.schema.js'),
        res?.data?.data ?? null,
      );
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
      throw ApiError.from(error);
    }
  },
};

export default FleetLinkHealthService;
