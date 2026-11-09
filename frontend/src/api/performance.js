import apiClient from '../utils/axiosConfig';
import { ApiError } from '../errors/ApiError';

const BASE = '/api/performance';

/**
 * A call to a path that is NOT under /api/performance — the learned
 * duty-group boards live at their own mount.
 */
const getFull = async (path, params = {}, signal) => {
  try {
    const response = await apiClient.get(path, { params, signal });
    return response.data?.data ?? response.data ?? {};
  } catch (error) {
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') throw error;
    throw ApiError.from(error);
  }
};

/**
 * A budget for the reads that are slow on the largest organisation: the first
 * load of the fleet tables and the leaderboards takes about 34 s there, so the
 * 30 s default would abort a healthy answer. It is set per call — the axios
 * interceptor only widens the default for known-slow paths, and
 * /api/performance is deliberately not one of them, so the other performance
 * reads keep the default budget.
 */
const SLOW_READ_TIMEOUT = 120000;

/**
 * The Performance API — wave 5.
 *
 * Every number the page shows arrives as a cell:
 *
 *   { value, unit, source, uncertainty, reason }
 *
 * with `source` one of measured | vendor | estimated | not_comparable |
 * insufficient_data. Nothing in this file turns a missing reading into 0 —
 * the page renders the cell exactly as the server sent it.
 */
const get = async (path, params = {}, signal, timeout) => {
  try {
    const config = { params, signal };
    // Only the heavy reads carry their own budget; the rest keep the default.
    if (timeout) config.timeout = timeout;
    const response = await apiClient.get(`${BASE}${path}`, config);
    return response.data?.data ?? response.data ?? {};
  } catch (error) {
    // A cancelled request is not a failure — useApi swallows it.
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') throw error;
    throw ApiError.from(error);
  }
};

export const PerformanceApi = {
  /** { window, vehicles: [{ vehicleKey, vehicleId, registration, provider, kmPerL, idlePct, topGearPct, overRevPct, healthFindings }] } */
  vehicles: (params = {}, signal) => get('/vehicles', params, signal, SLOW_READ_TIMEOUT),
  /** { vehicle, gearRpm, health, efficiencyDrift, harshEvents } */
  vehicle: (vehicleId, params = {}, signal) =>
    get(`/vehicles/${encodeURIComponent(vehicleId)}`, params, signal),
  /** { window, drivers: [{ driverId, name, dnaScore, harshPer100Km, idlePct, vehicles }] } */
  drivers: (params = {}, signal) => get('/drivers', params, signal, SLOW_READ_TIMEOUT),
  /** { driver, dna } — the DNA payload with every number as a cell. */
  driver: (driverId, params = {}, signal) =>
    get(`/drivers/${encodeURIComponent(driverId)}`, params, signal),
  /** { window, boards: [{ key, label, rows: [{ rank, subjectId, subjectName, score }] }] } */
  leaderboards: (params = {}, signal) => get('/leaderboards', params, signal, SLOW_READ_TIMEOUT),
  /**
   * The learned duty-group boards — GET /api/leaderboards/boards.
   * { window, dataAsOf, boards: [{ key, title, unit, direction, measures, doesNotMeasure,
   *   numerator, denominator, groups: [{ dutyGroup, rankedCount, floor, rows }] }], meta }
   */
  boards: (params = {}, signal) => getFull('/api/leaderboards/boards', params, signal),
};

export default PerformanceApi;
