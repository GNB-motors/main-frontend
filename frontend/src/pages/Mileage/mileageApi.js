import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';
import { getVehicleList } from '../../services/vehicleListService';
import { parseSafe } from '../../schemas/validate';
import { rangeToParams } from './mileageDates';
import { MileageTrackingService } from '../MileageTracking/MileageTrackingService';

/**
 * The hub's reads. Each takes the hub's calendar range where its endpoint
 * accepts one, passes the AbortSignal through, and checks the body against
 * its schema (a drift is logged, never turned into an outage).
 */
const hubSchemas = () => import('../../schemas/mileageHub.schema.js');
const get = (url, params, signal, schema) =>
  apiClient
    .get(url, { params, signal })
    .then((res) => parseSafe(schema, hubSchemas, res.data ?? null));

export const MileageApi = {
  pumpOptions: (refuelId, signal) =>
    apiClient
      .get(`/api/fuel-logs/${encodeURIComponent(refuelId)}/pump-options`, { signal })
      .then((res) => res.data.data),
  savePump: (refuelId, body) =>
    apiClient
      .post(`/api/fuel-logs/${encodeURIComponent(refuelId)}/pump`, body)
      .then((res) => res.data.data),
  unifiedFeed: (range, params, signal) =>
    get(
      '/api/fuel-logs/unified',
      { ...rangeToParams(range), ...params },
      signal,
      'unifiedFeedSchema',
    ),
  // Shares the By-model view's call (see MileageTrackingService), so the hub
  // never runs this slow read twice at once.
  modelComparison: (range) =>
    MileageTrackingService.getModelComparison(rangeToParams(range)).then((data) =>
      parseSafe('modelComparisonSchema', hubSchemas, data ?? null),
    ),
  // Optional from/to bounds match the closing full-tank timestamp, inclusive.
  intervals: (params, signal) => get('/api/mileage/intervals', params, signal, 'intervalsSchema'),
  fuelCycles: (range, signal) =>
    get('/api/reports/fuel-cycles', rangeToParams(range), signal, 'fuelCyclesSchema'),
  billVsTank: (range, params, signal) =>
    get(
      '/api/fuel-comparison/records',
      { ...rangeToParams(range), ...params },
      signal,
      'billVsTankSchema',
    ),
  updateBill: ({ id, ...body }, { signal } = {}) =>
    apiClient.put(`/api/mileage/fuel-log/${id}`, body, { signal }).then((res) => res.data),
  deleteBill: (id, { signal } = {}) =>
    apiClient.delete(`/api/mileage/fuel-log/${id}`, { signal }).then((res) => res.data),
  vehicles: (signal) => getVehicleList({ signal }),
  expected: (range, vehicleId, signal) =>
    get(
      '/api/fuel-model/expected',
      { vehicleId, ...rangeToParams({ from: range.from, to: range.to }) },
      signal,
      'expectedFuelSchema',
    ),
  /**
   * GET /api/mileage-rollup — the ONE fleet km/L rollup.
   *
   * The hub sends exact IST calendar bounds. The backend recomputes over
   * cycles completed in that range, using the same rule as the Mileage KPI.
   */
  rollup: (range, signal) =>
    get('/api/mileage-rollup', rangeToParams(range), signal, 'mileageRollupSchema').then(
      (body) => body?.data ?? body,
    ),
  pumpLedger: (range, signal) =>
    apiClient.get('/api/fuel-integrity/pump-ledger', { params: rangeToParams(range), signal }).then(
      (res) =>
        parseSafe(
          'pumpLedgerSchema',
          () => import('../../schemas/pumpLedger.schema.js'),
          res.data?.data ?? null,
        ),
      (error) => {
        throw ApiError.from(error);
      },
    ),
};
