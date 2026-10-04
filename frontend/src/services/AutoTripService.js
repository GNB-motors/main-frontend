import apiClient from '../utils/axiosConfig';
import { parseSafe } from '../schemas/validate.js';

const BASE = '/api/auto-trips';
const schemas = () => import('../schemas/autoTrip.schema.js');

const unwrap = (response) => response.data?.data ?? response.data;
const parsed = async (name, response) => parseSafe(name, schemas, unwrap(response));

/**
 * Auto Trips API. Behind the per-org `autoTrips` flag; with the flag off the calls
 * 404 and the page shows a calm empty state. Trips are detected from GPS stops and
 * confirmed pickup/drop places — never declared.
 */
export const AutoTripService = {
  list: async (params = {}, { signal } = {}) =>
    parsed('autoTripListSchema', await apiClient.get(BASE, { params, signal })),

  coverage: async ({ signal } = {}) =>
    parsed('autoTripCoverageSchema', await apiClient.get(`${BASE}/coverage`, { signal })),

  oilAverage: async (params = {}, { signal } = {}) =>
    parsed(
      'autoTripOilAverageSchema',
      await apiClient.get(`${BASE}/oil-average`, { params, signal }),
    ),

  get: async (id, { signal } = {}) =>
    parsed('autoTripDetailSchema', await apiClient.get(`${BASE}/${id}`, { signal })),

  confirm: async ({ id }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/${id}/confirm`, {}, { signal })),

  drop: async ({ id, ...body }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/${id}/drop`, body, { signal })),

  dismiss: async ({ id, reason }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/${id}/dismiss`, reason ? { reason } : {}, { signal })),
};

export default AutoTripService;
