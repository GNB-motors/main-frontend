/**
 * The Intelligence page's API calls.
 *
 * The summary, the issues and the place questions come from the shared
 * fleet-view service: it already parses them, already aborts them and
 * already types them.
 *
 * The other calls are here because the shared service drops the parameters
 * the contract asks for — `subject` on the report cards, `page`/`limit` on
 * the instances, `from`/`to` on the mileage and the trip history. A period
 * filter the API never receives, or a tab that cannot say which subject it
 * wants, would put a wrong number on the screen.
 */
import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';
import { getBranchId, getOrgId, getUserId } from '../../utils/session.js';
import { parseSafe } from '../../schemas/validate';
import fleetViewService from '../../services/fleetViewService';

/** The body of a response, whether the API wraps it in `data` or not. */
function bodyOf(res) {
  const payload = res?.data;
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
  return payload;
}

/**
 * Request, parse, typed error.
 *
 * `parseSafe` never fails a request over a schema mismatch: a schema bug has
 * to look like "unvalidated", not like "the network is down".
 */
async function get(path, { params, signal, schema, importer }) {
  try {
    const res = await apiClient.get(path, { params, signal });
    return await parseSafe(schema, importer, bodyOf(res));
  } catch (error) {
    throw ApiError.from(error);
  }
}

const importIntelligence = () => import('../../schemas/intelligence.schema.js');
const importMileage = () => import('../../schemas/mileageV2.schema.js');
const importTripsHistory = () => import('../../schemas/tripsHistory.schema.js');
const importAutoTrips = () => import('../../schemas/autoTrip.schema.js');

const SHARED_TTL_MS = 30 * 1000;
const issueCalls = new Map();

// The API caps pages at 200. Fetch every page before applying local groups,
// so counts and filtering never describe only the first 50 records.
async function readAllPages(fetchPage, signal) {
  const first = await fetchPage(1, 200);
  if (first?.held) return first;
  const items = [...(first?.items || [])];
  const total = first?.total ?? items.length;
  let page = 2;
  while (items.length < total) {
    if (signal?.aborted) throw Object.assign(new Error('Canceled'), { code: 'ERR_CANCELED' });
    const next = await fetchPage(page, 200);
    if (next?.held || !next?.items?.length)
      throw new Error('The complete list could not be loaded. Please retry.');
    items.push(...next.items);
    page += 1;
  }
  return { ...first, items, total };
}

const IntelligenceService = {
  /** GET /api/intelligence/summary — the tiles and the run numbers. */
  getSummary: ({ from, to, signal } = {}) =>
    fleetViewService.getIntelligenceSummary({ from, to, signal }),

  /** GET /api/intelligence/issues — the open problems, good and bad. */
  // The page header and the Issues tab both ask for the same range at once;
  // they share one call (scoped like every session cache) instead of two.
  // The shared call carries no AbortSignal, so one reader leaving never
  // cancels the other's answer.
  getIssues: ({ from, to } = {}) => {
    const key = `${getUserId() || ''}:${getOrgId() || ''}:${getBranchId() || 'all'}:${from}:${to}`;
    const hit = issueCalls.get(key);
    if (hit && Date.now() - hit.at < SHARED_TTL_MS) return hit.promise;
    const promise = readAllPages((page, limit) =>
      fleetViewService.getIntelligenceIssues({ from, to, page, limit }),
    );
    issueCalls.set(key, { at: Date.now(), promise });
    promise.catch(() => issueCalls.delete(key));
    return promise;
  },

  /** GET /api/fleet-view/places/questions — the places waiting for a name. */
  getPlaceQuestions: ({ signal } = {}) => fleetViewService.getPlaceQuestions({ signal }),

  /** GET /api/intelligence/report-cards — one card per truck or driver. */
  getReportCards: ({ subject, from, to, signal } = {}) =>
    get('/api/intelligence/report-cards', {
      params: { subject, from, to },
      signal,
      schema: 'ReportCardsResponseSchema',
      importer: importIntelligence,
    }),

  /** GET /api/intelligence/instances — the moments behind one kind of event. */
  getInstances: ({ kind, from, to, vehicle, driver, page, limit, signal } = {}) =>
    get('/api/intelligence/instances', {
      params: { kind, from, to, vehicle, driver, page, limit },
      signal,
      schema: 'InstancesResponseSchema',
      importer: importIntelligence,
    }),

  /** GET /api/fleet-view/mileage — km/L and DEF for the period that was asked for. */
  getMileage: ({ from, to, vehicle, signal } = {}) =>
    get('/api/fleet-view/mileage', {
      params: { groupBy: 'truck', from, to, vehicle },
      signal,
      schema: 'MileageResponseSchema',
      importer: importMileage,
    }),

  /** GET /api/fleet-view/trips/history — the visits of the period, and the busiest places. */
  getTripsHistory: ({ from, to, vehicle, limit, signal } = {}) =>
    get('/api/fleet-view/trips/history', {
      params: { from, to, vehicle, limit },
      signal,
      schema: 'TripsHistoryResponseSchema',
      importer: importTripsHistory,
    }),

  /** GET /api/auto-trips — the trips of the period, with their legs. */
  getAutoTrips: ({ from, to, signal } = {}) =>
    readAllPages(
      (page, limit) =>
        get('/api/auto-trips', {
          params: { from, to, page, limit },
          signal,
          schema: 'autoTripListSchema',
          importer: importAutoTrips,
        }),
      signal,
    ),
};

export default IntelligenceService;
