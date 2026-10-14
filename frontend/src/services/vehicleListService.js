import apiClient from '../utils/axiosConfig';
import { getUserId, getOrgId, getBranchId } from '../utils/session.js';
import { parseSafe } from '../schemas/validate.js';
import ApiError from '../errors/ApiError';

/**
 * The fleet's vehicle list for pickers and lookups, fetched once and shared.
 *
 * Screens used to pull /api/vehicles on their own, several with limit 100, 200
 * or the API's default of 10, which silently dropped trucks on bigger fleets.
 * This walks GET /api/vehicles/options (slim picker rows) 500 at a time until
 * it has every page.
 *
 * Cached per user + org + active branch (the API scopes the list by
 * X-Branch-Id) for a few minutes; vehicle writes call invalidateVehicleList().
 */

const PAGE_SIZE = 500;
// Only for a backend deployed before /vehicles/options existed.
const LEGACY_LIMIT = 1000;
const TTL_MS = 5 * 60 * 1000;

const cache = new Map();

const scopeKey = () => `${getUserId() || ''}:${getOrgId() || ''}:${getBranchId() || 'all'}`;

const rowsOf = (res) => {
  const rows = res.data?.data ?? res.data ?? [];
  return Array.isArray(rows) ? rows : [];
};

const fetchOptionPages = async () => {
  const rows = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await apiClient.get('/api/vehicles/options', {
      params: { page, limit: PAGE_SIZE },
    });
    const pageRows = rowsOf(res);
    rows.push(...pageRows);
    totalPages = res.data?.meta?.totalPages ?? 1;
    page += 1;
    if (!pageRows.length) break;
  } while (page <= totalPages);
  return rows;
};

const fetchFleet = async () => {
  let rows;
  try {
    rows = await fetchOptionPages();
  } catch (err) {
    if ((err?.status ?? err?.response?.status) !== 404) throw err;
    const res = await apiClient.get('/api/vehicles', { params: { page: 1, limit: LEGACY_LIMIT } });
    rows = rowsOf(res);
  }
  return parseSafe('vehicleListSchema', () => import('../schemas/vehicle.schema.js'), rows);
};

const canceled = () =>
  Object.assign(new Error('canceled'), { name: 'CanceledError', code: 'ERR_CANCELED' });

// The shared request outlives any one screen, so an abort only detaches its caller.
const detachOnAbort = (promise, signal) => {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(canceled());
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(canceled());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
};

export const getVehicleList = ({ signal } = {}) => {
  const key = scopeKey();
  let entry = cache.get(key);
  if (!entry || Date.now() - entry.at > TTL_MS) {
    const promise = fetchFleet().catch((err) => {
      if (cache.get(key)?.promise === promise) cache.delete(key);
      throw ApiError.from(err);
    });
    entry = { at: Date.now(), promise };
    cache.set(key, entry);
  }
  return detachOnAbort(entry.promise, signal);
};

export const invalidateVehicleList = () => cache.clear();
