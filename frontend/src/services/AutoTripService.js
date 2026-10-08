import apiClient from '../utils/axiosConfig';
import { parseSafe } from '../schemas/validate.js';

const BASE = '/api/auto-trips';
const schemas = () => import('../schemas/autoTrip.schema.js');

const unwrap = (response) => response.data?.data ?? response.data;
const parsed = async (name, response) => parseSafe(name, schemas, unwrap(response));

/**
 * Auto Trips API. Open to every org user (no per-org flag); trips exist once the
 * server's nightly detection has run. Trips are detected from GPS stops and confirmed
 * pickup/drop places — never declared.
 */
export const AutoTripService = {
  list: async (params = {}, { signal } = {}) =>
    parsed('autoTripListSchema', await apiClient.get(BASE, { params, signal })),

  /** Our trips vs the org's own trip register (latest per algorithm + daily series). */
  registerMatch: async ({ signal } = {}) =>
    unwrap(await apiClient.get('/api/reports/register-match', { signal })),

  coverage: async ({ signal } = {}) =>
    parsed('autoTripCoverageSchema', await apiClient.get(`${BASE}/coverage`, { signal })),

  oilAverage: async (params = {}, { signal } = {}) =>
    parsed(
      'autoTripOilAverageSchema',
      await apiClient.get(`${BASE}/oil-average`, { params, signal }),
    ),

  get: async (id, { signal } = {}) =>
    parsed('autoTripDetailSchema', await apiClient.get(`${BASE}/${id}`, { signal })),

  /** GPS track to replay a trip: left plant → last drop (next pickup / now while open). */
  track: async (id, { signal } = {}) =>
    parsed('autoTripTrackSchema', await apiClient.get(`${BASE}/${id}/track`, { signal })),

  confirm: async ({ id }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/${id}/confirm`, {}, { signal })),

  // Returns { trip, recompute } once the backend ships the contract shape; the
  // caller reads `.trip` with a fallback so it works before and after.
  drop: async ({ id, ...body }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/${id}/drop`, body, { signal })),

  // reallocateAs (UNATTRIBUTED | REPOSITION | PERSONAL) is optional; the trip's km
  // are re-allocated, never dropped. Omitted → backend default (UNATTRIBUTED).
  dismiss: async ({ id, reason, reallocateAs }, { signal } = {}) =>
    unwrap(
      await apiClient.post(
        `${BASE}/${id}/dismiss`,
        {
          ...(reason ? { reason } : {}),
          ...(reallocateAs ? { reallocateAs } : {}),
        },
        { signal },
      ),
    ),
};

export default AutoTripService;
