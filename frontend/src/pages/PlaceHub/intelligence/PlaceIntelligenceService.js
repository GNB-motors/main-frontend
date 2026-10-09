import apiClient from '../../../utils/axiosConfig';
import { parseSafe } from '../../../schemas/validate.js';

const BASE = '/api/place-intelligence';
const schemas = () => import('../../../schemas/placeIntelligence.schema.js');

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
  summary: async ({ signal } = {}) =>
    parsed('summarySchema', await apiClient.get(`${BASE}/summary`, { signal })),

  getSite: async (id, { signal } = {}) =>
    parsed('siteDetailSchema', await apiClient.get(`${BASE}/sites/${id}`, { signal })),

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

  retype: async ({ id, siteType }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/sites/${id}/retype`, { siteType }, { signal })),

  /** The global layer (dead zones) around the fleet — no org data by construction. */
  listGlobalPlaces: async ({ bbox, types }, { signal } = {}) =>
    parsed(
      'globalPlaceListSchema',
      await apiClient.get(`${BASE}/places`, { params: { bbox, types }, signal }),
    ),

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

  // ─── Regions (grouped sites a truck treats as one place) ───────────────────
  listRegions: async (params = {}, { signal } = {}) =>
    parsed('regionListSchema', await apiClient.get(`${BASE}/regions`, { params, signal })),

  decideRegion: async ({ id, decision }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/regions/${id}/decide`, { decision }, { signal })),

  // ─── Facilities (one row per physical place; what trip detection sees) ────
  listFacilities: async (params = {}, { signal } = {}) =>
    unwrap(await apiClient.get(`${BASE}/facilities`, { params, signal })),

  // ─── Map knowledge (plants, pumps, sidings, towns …) learned from OSM/Google
  listPoi: async ({ south, west, north, east, categories }, { signal } = {}) =>
    unwrap(
      await apiClient.get(`${BASE}/poi`, {
        params: { south, west, north, east, ...(categories ? { categories } : {}) },
        signal,
      }),
    ),

  poiStatus: async ({ signal } = {}) =>
    unwrap(await apiClient.get(`${BASE}/poi/status`, { signal })),

  // ─── Driver homes (inferred overnight base per driver) ─────────────────────
  listHomes: async (params = {}, { signal } = {}) =>
    parsed('homeListSchema', await apiClient.get(`${BASE}/homes`, { params, signal })),

  decideHome: async ({ id, decision }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/homes/${id}/decide`, { decision }, { signal })),
};

export default PlaceIntelligenceService;
