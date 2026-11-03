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
  listDeliveryLegs: async (params = {}, { signal } = {}) =>
    parsed(
      'deliveryLegListSchema',
      await apiClient.get(`${BASE}/routes/delivery-legs`, { params, signal }),
    ),
  getDeliveryLeg: async (id, { signal } = {}) =>
    parsed(
      'deliveryLegSchema',
      await apiClient.get(`${BASE}/routes/delivery-legs/${id}`, { signal }),
    ),
  reviewDeliveryLeg: async ({ id, ...body }, { signal } = {}) =>
    parsed(
      'deliveryLegSchema',
      await apiClient.post(`${BASE}/routes/delivery-legs/${id}/review`, body, { signal }),
    ),
  duplicates: async ({ signal } = {}) =>
    parsed('duplicateListSchema', await apiClient.get(`${BASE}/duplicates`, { signal })),
  mergeSites: async (body, { signal } = {}) =>
    parsed('placeMutationSchema', await apiClient.post(`${BASE}/sites/merge`, body, { signal })),
  distinctSites: async ({ id, otherId }, { signal } = {}) =>
    parsed(
      'placeMutationSchema',
      await apiClient.post(`${BASE}/sites/${id}/distinct`, { otherId }, { signal }),
    ),
  listMerges: async (survivorId, { signal } = {}) =>
    parsed(
      'mergeHistorySchema',
      await apiClient.get(`${BASE}/sites/merges`, { params: { survivorId }, signal }),
    ),
  undoMerge: async (id, { signal } = {}) =>
    parsed(
      'placeMutationSchema',
      await apiClient.post(`${BASE}/sites/merges/${id}/undo`, {}, { signal }),
    ),
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

  routesMap: async (params = {}, { signal } = {}) =>
    parsed('routesMapSchema', await apiClient.get(`${BASE}/routes/map`, { params, signal })),

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

  /** Toll plazas: every one this org's trucks visited, or (scope 'all') every one in a box. */
  listTollPlazas: async ({ scope, south, west, north, east }, { signal } = {}) =>
    parsed(
      'tollPlazaListSchema',
      await apiClient.get(`${BASE}/toll-plazas`, {
        params: scope === 'all' ? { scope, south, west, north, east } : { scope },
        signal,
      }),
    ),

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

  // ─── Task 11 — duplicate merges, confidence, ranked suggestions ─────────────
  /**
   * Duplicate groups the server found within the merge radius. `radiusM` is the
   * same knob the confidence score uses; leave it off to get the configured
   * default (100 m unless PLACE_MERGE_RADIUS_M says otherwise).
   */
  previewMerges: async ({ radiusM } = {}, { signal } = {}) =>
    parsed(
      'mergePreviewSchema',
      await apiClient.get(`${BASE}/merges/preview`, {
        params: radiusM ? { radiusM } : undefined,
        signal,
      }),
    ),

  /** What a merge will do — the richer record and how many stoppages move. */
  previewMergeApply: async ({ survivorId, memberIds }, { signal } = {}) =>
    parsed(
      'mergeApplyPreviewSchema',
      await apiClient.post(`${BASE}/merges/preview-apply`, { survivorId, memberIds }, { signal }),
    ),

  applyMerge: async ({ survivorId, memberIds }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/merges/apply`, { survivorId, memberIds }, { signal })),

  /** Rescore confidence for one site, or for the whole org when siteId is omitted. */
  recomputeConfidence: async ({ siteId, radiusM, threshold, minSamples } = {}, { signal } = {}) =>
    unwrap(
      await apiClient.post(
        `${BASE}/confidence/recompute`,
        {
          ...(siteId ? { siteId } : {}),
          ...(radiusM ? { radiusM } : {}),
          ...(threshold != null ? { threshold } : {}),
          ...(minSamples != null ? { minSamples } : {}),
        },
        { signal },
      ),
    ),

  /**
   * Ranked place picker. The server ranks by exact-prefix name match, then
   * distance to `viewport` (the map centre), then stoppage frequency, then
   * confidence — and hides low-confidence places unless asked.
   */
  suggestSites: async (
    { q = '', viewport = null, role, status, includeLowConfidence = false, limit = 20 } = {},
    { signal } = {},
  ) =>
    parsed(
      'siteSuggestionListSchema',
      await apiClient.get(`${BASE}/sites/suggestions`, {
        params: {
          q,
          ...(viewport ? { viewport: JSON.stringify(viewport) } : {}),
          ...(role ? { role } : {}),
          ...(status ? { status } : {}),
          includeLowConfidence,
          limit,
        },
        signal,
      }),
    ),

  /** Pin-drop check: places within the merge radius of a point. */
  nearbySites: async ({ lat, lng, radiusM, limit = 5 } = {}, { signal } = {}) =>
    parsed(
      'nearbySitesSchema',
      await apiClient.get(`${BASE}/sites/nearby`, {
        params: { lat, lng, ...(radiusM ? { radiusM } : {}), limit },
        signal,
      }),
    ),
};

export default PlaceIntelligenceService;
