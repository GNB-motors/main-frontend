import apiClient from '../utils/axiosConfig';
import { parseSafe } from '../schemas/validate.js';

const BASE = '/api/excursions';
const schemas = () => import('../schemas/excursion.schema.js');

const unwrap = (response) => response.data?.data ?? response.data;
const parsed = async (name, response) => parseSafe(name, schemas, unwrap(response));

/**
 * Excursions (deviations) API. Behind the `autoTrips` flag (OWNER/MANAGER). An
 * excursion is a non-business detour detected from a trip; it is reviewed into
 * APPROVED_LATE or NOT_DEVIATION, or classified with a purpose.
 */
export const ExcursionService = {
  list: async (params = {}, { signal } = {}) =>
    parsed('excursionListSchema', await apiClient.get(BASE, { params, signal })),

  get: async (id, { signal } = {}) =>
    parsed('excursionDetailSchema', await apiClient.get(`${BASE}/${id}`, { signal })),

  classify: async ({ id, ...body }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/${id}/classify`, body, { signal })),

  approveLate: async ({ id, ...body }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/${id}/approve-late`, body, { signal })),

  notADeviation: async ({ id, ...body }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/${id}/not-a-deviation`, body, { signal })),
};

export default ExcursionService;
