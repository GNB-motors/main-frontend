import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';
import { parseSafe } from '../../schemas/validate.js';

/**
 * MileageService — the Mileage page's read of the 3 Nov 2026 contract.
 *
 * `fleetViewService.getMileage` already knows this path and this schema, but
 * it was written before the contract grew `groupBy` and `vehicle`, so it
 * cannot ask for one truck's fill-to-fill cycles, and it cannot ask for a
 * date range. Until the shared service grows those parameters, this file is
 * the one that knows how to ask; when it does, this file shrinks to a
 * re-export of it.
 */

/** The body of a response, whether the API wraps it in `data` or not. */
function bodyOf(res) {
  const payload = res?.data;
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
  return payload;
}

/** The schema module is loaded on demand so zod stays out of the main chunk. */
const importMileageV2 = () => import('../../schemas/mileageV2.schema.js');

/** Drops the parameters the page did not set, so the URL stays readable. */
function onlySet(params) {
  const out = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    out[key] = value;
  });
  return out;
}

export const MileageService = {
  /**
   * GET /api/fleet-view/mileage
   *
   * `groupBy` is 'truck' for one row per truck and 'cycle' for one row per
   * fill-to-fill cycle; `vehicle` narrows the cycles to a single truck.
   *
   * @param {object} query - { groupBy, vehicle, from, to, manufacturer }
   * @param {AbortSignal} signal - aborts the request when the page moves on
   */
  getMileage: async (query = {}, signal) => {
    const params = onlySet({
      groupBy: query.groupBy,
      vehicle: query.vehicle,
      from: query.from,
      to: query.to,
      manufacturer: query.manufacturer,
    });
    try {
      const res = await apiClient.get('/api/fleet-view/mileage', { params, signal });
      return await parseSafe('MileageResponseSchema', importMileageV2, bodyOf(res));
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
      throw ApiError.from(error);
    }
  },
};

export default MileageService;
