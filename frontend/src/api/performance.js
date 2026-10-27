import apiClient from '../utils/axiosConfig';
import { ApiError } from '../errors/ApiError';

const BASE = '/api/performance';

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
const get = async (path, params = {}, signal) => {
  try {
    const response = await apiClient.get(`${BASE}${path}`, { params, signal });
    return response.data?.data ?? response.data ?? {};
  } catch (error) {
    // A cancelled request is not a failure — useApi swallows it.
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') throw error;
    throw ApiError.from(error);
  }
};

export const PerformanceApi = {
  /** { window, vehicles: [{ vehicleKey, vehicleId, registration, provider, kmPerL, idlePct, topGearPct, overRevPct, healthFindings }] } */
  vehicles: (params = {}, signal) => get('/vehicles', params, signal),
  /** { vehicle, gearRpm, health, efficiencyDrift, harshEvents } */
  vehicle: (vehicleId, params = {}, signal) =>
    get(`/vehicles/${encodeURIComponent(vehicleId)}`, params, signal),
  /** { window, drivers: [{ driverId, name, dnaScore, harshPer100Km, idlePct, vehicles }] } */
  drivers: (params = {}, signal) => get('/drivers', params, signal),
  /** { driver, dna } — the DNA payload with every number as a cell. */
  driver: (driverId, params = {}, signal) =>
    get(`/drivers/${encodeURIComponent(driverId)}`, params, signal),
  /** { window, boards: [{ key, label, rows: [{ rank, subjectId, subjectName, score }] }] } */
  leaderboards: (params = {}, signal) => get('/leaderboards', params, signal),
};

export default PerformanceApi;
