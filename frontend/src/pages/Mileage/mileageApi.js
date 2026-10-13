import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';
import { getVehicleList } from '../../services/vehicleListService';
import { parseSafe } from '../../schemas/validate';
import { rangeToParams } from './mileageRows';

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
  unifiedFeed: (range, params, signal) =>
    get(
      '/api/fuel-logs/unified',
      { ...rangeToParams(range), ...params },
      signal,
      'unifiedFeedSchema',
    ),
  modelComparison: (range, signal) =>
    get('/api/mileage/model-comparison', rangeToParams(range), signal, 'modelComparisonSchema'),
  // The intervals list cannot be narrowed by date on the server yet.
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
      { vehicleId, ...rangeToParams(range) },
      signal,
      'expectedFuelSchema',
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
