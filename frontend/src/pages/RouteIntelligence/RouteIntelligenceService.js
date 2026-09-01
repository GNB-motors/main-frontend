import apiClient from '../../utils/axiosConfig';

const BASE = '/api/route-intelligence';

/**
 * Service helpers for the Route Intelligence feed.
 *
 * All endpoints are gated by the `fleetIntelligence` feature flag on the backend;
 * when the flag is off the calls return 404, which the page renders as a calm
 * empty state rather than crashing.
 */
export const RouteIntelligenceService = {
  listSites: async ({ status, siteType, page = 1, limit = 25 } = {}, { signal } = {}) => {
    const response = await apiClient.get(`${BASE}/sites`, {
      params: { status, siteType, page, limit },
      signal,
    });
    return response.data?.data ?? response.data;
  },

  confirmSite: async (id) => {
    const response = await apiClient.post(`${BASE}/sites/${id}/confirm`);
    return response.data?.data ?? response.data;
  },

  listCorridors: async (
    { originSiteId, destinationSiteId, usableForDeviation, page = 1, limit = 25 } = {},
    { signal } = {}
  ) => {
    const response = await apiClient.get(`${BASE}/corridors`, {
      params: { originSiteId, destinationSiteId, usableForDeviation, page, limit },
      signal,
    });
    return response.data?.data ?? response.data;
  },

  listDeviations: async (
    { vehicle, from, to, status, page = 1, limit = 25 } = {},
    { signal } = {}
  ) => {
    const response = await apiClient.get(`${BASE}/deviations`, {
      params: { vehicle, from, to, status, page, limit },
      signal,
    });
    return response.data?.data ?? response.data;
  },

  listArrivals: async (
    { siteId, vehicle, from, to, status, page = 1, limit = 25 } = {},
    { signal } = {}
  ) => {
    const response = await apiClient.get(`${BASE}/arrivals`, {
      params: { siteId, vehicle, from, to, status, page, limit },
      signal,
    });
    return response.data?.data ?? response.data;
  },
};

export default RouteIntelligenceService;
