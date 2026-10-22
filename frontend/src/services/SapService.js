import apiClient from '../utils/axiosConfig';
import { parseSafe } from '../schemas/validate';
const BASE = '/api/sap';
const unwrap = (r) => r.data?.data ?? r.data;
const schemas = () => import('../schemas/sap.schema');
const parsed = (name, response) => parseSafe(name, schemas, unwrap(response));
export const SapService = {
  trip: async (id, { signal } = {}) =>
    parsed('sapTripDetailSchema', await apiClient.get(`${BASE}/trips/${id}`, { signal })),
  lanes: async (params = {}, { signal } = {}) =>
    parsed('sapLaneListSchema', await apiClient.get(`${BASE}/lanes`, { params, signal })),
  settings: async ({ signal } = {}) =>
    parsed('sapSettingsSchema', await apiClient.get(`${BASE}/settings`, { signal })),
  saveSettings: async (body, { signal } = {}) =>
    parsed('sapSettingsSchema', await apiClient.put(`${BASE}/settings`, body, { signal })),
  importSheet: async (body, { signal } = {}) =>
    parsed('sapImportSchema', await apiClient.post(`${BASE}/import`, body, { signal })),
  matchReview: async ({ signal } = {}) =>
    parsed('sapMatchReviewSchema', await apiClient.get(`${BASE}/match-review`, { signal })),
  alias: async (body, { signal } = {}) =>
    parsed('sapAliasSchema', await apiClient.post(`${BASE}/aliases`, body, { signal })),
  setRouteKm: async (body, { signal } = {}) =>
    parsed('sapRouteKmSchema', await apiClient.put(`${BASE}/route-km`, body, { signal })),
  removeRouteKm: async (id, { signal } = {}) =>
    parsed('sapDeleteSchema', await apiClient.delete(`${BASE}/route-km/${id}`, { signal })),
};
export default SapService;
