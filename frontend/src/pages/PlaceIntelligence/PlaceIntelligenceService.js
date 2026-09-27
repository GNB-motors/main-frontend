import apiClient from '../../utils/axiosConfig';
import { parseSafe } from '../../schemas/validate.js';

const BASE = '/api/place-intelligence';
const schemas = () => import('../../schemas/placeIntelligence.schema.js');

const unwrap = (response) => response.data?.data ?? response.data;
const parsed = async (name, response) => parseSafe(name, schemas, unwrap(response));

/**
 * Place Intelligence API. Every endpoint is behind the `fleetIntelligence` flag;
 * with the flag off the calls 404 and the page shows a calm empty state.
 *
 * Warehouse changes (accept as WAREHOUSE) answer 409 with an `impact` body
 * until resent with `confirmImpact: true` — see isImpactGate in the model.
 */
export const PlaceIntelligenceService = {
  reviewQueue: async ({ limit = 30 } = {}, { signal } = {}) =>
    parsed(
      'reviewQueueSchema',
      await apiClient.get(`${BASE}/review-queue`, { params: { limit }, signal }),
    ),

  listSites: async (params = {}, { signal } = {}) =>
    parsed('siteListSchema', await apiClient.get(`${BASE}/sites`, { params, signal })),

  accept: async ({ id, ...body }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/sites/${id}/accept`, body, { signal })),

  reject: async ({ id, note }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/sites/${id}/reject`, note ? { note } : {}, { signal })),

  listBreaks: async (params = {}, { signal } = {}) =>
    parsed('breakListSchema', await apiClient.get(`${BASE}/breaks`, { params, signal })),

  tagStop: async ({ id, purpose }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/stops/${id}/reason`, { purpose }, { signal })),

  listLegs: async (params = {}, { signal } = {}) =>
    parsed('legListSchema', await apiClient.get(`${BASE}/routes/legs`, { params, signal })),

  getLeg: async (id, { signal } = {}) =>
    parsed('legDetailSchema', await apiClient.get(`${BASE}/routes/legs/${id}`, { signal })),

  shadowReports: async (orgId, { signal } = {}) =>
    parsed(
      'shadowReportListSchema',
      await apiClient.get(`${BASE}/admin/shadow-reports`, { params: { orgId }, signal }),
    ),
};

export default PlaceIntelligenceService;
