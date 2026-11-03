import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';
import { parseSafe } from '../schemas/validate.js';
import { linkStateItems } from '../lib/fleetLink.js';

/**
 * fleetViewService — every endpoint of the 3 Nov 2026 fleet-view API.
 *
 * The contract is API_CONTRACTS.md. Each function parses its response with
 * the zod schema for that endpoint before the data reaches a component, and
 * every request takes an AbortSignal so a page that moves on does not leave
 * a request running.
 */

/** The body of a response, whether the API wraps it in `data` or not. */
function bodyOf(res) {
  const payload = res?.data;
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
  return payload;
}

/**
 * The shared shape of every call: request, parse, typed error.
 * `parseSafe` never fails a request over a schema mismatch — a schema bug
 * must look like "unvalidated", not like "the network is down".
 */
async function get(path, { params, signal, schema, importer }) {
  try {
    const res = await apiClient.get(path, { params, signal });
    const body = bodyOf(res);
    if (!schema) return body;
    return await parseSafe(schema, importer, body);
  } catch (error) {
    throw ApiError.from(error);
  }
}

/* ── §2, §3 The vehicle panel ─────────────────────────────────────────── */

const importFleetView = () => import('../schemas/fleetView.schema.js');

/** GET /api/fleet-view/vehicles/:reg/now */
export const getVehicleNow = (reg, { signal } = {}) =>
  get(`/api/fleet-view/vehicles/${encodeURIComponent(reg)}/now`, {
    signal,
    schema: 'VehicleNowResponseSchema',
    importer: importFleetView,
  });

/** GET /api/fleet-view/vehicles/:reg/where-next */
export const getWhereNext = (reg, { signal } = {}) =>
  get(`/api/fleet-view/vehicles/${encodeURIComponent(reg)}/where-next`, {
    signal,
    schema: 'WhereNextResponseSchema',
    importer: importFleetView,
  });

/* ── §5 The track of one truck over a range ──────────────────────────── */

/** GET /api/fleet-view/vehicles/:reg/track */
export const getVehicleTrack = (reg, { from, to, signal } = {}) =>
  get(`/api/fleet-view/vehicles/${encodeURIComponent(reg)}/track`, {
    params: { from, to },
    signal,
    schema: 'TrackResponseSchema',
    importer: () => import('../schemas/track.schema.js'),
  });

/* ── §6 The map ───────────────────────────────────────────────────────── */

const importMapPlaces = () => import('../schemas/mapPlaces.schema.js');

/** GET /api/fleet-view/map/places — the places inside the visible map box. */
export const getMapPlaces = ({ bbox, layers, signal } = {}) =>
  get('/api/fleet-view/map/places', {
    params: { bbox, layers },
    signal,
    schema: 'MapPlacesResponseSchema',
    importer: importMapPlaces,
  });

/** GET /api/fleet-view/campuses — a plant is a whole campus, one circle. */
export const getCampuses = ({ signal } = {}) =>
  get('/api/fleet-view/campuses', {
    signal,
    schema: 'CampusesResponseSchema',
    importer: importMapPlaces,
  });

/** GET /api/fleet-view/nearby-help */
export const getNearbyHelp = ({ lat, lng, signal } = {}) =>
  get('/api/fleet-view/nearby-help', {
    params: { lat, lng },
    signal,
    schema: 'NearbyHelpResponseSchema',
    importer: importMapPlaces,
  });

/* ── §7 Trips and places ──────────────────────────────────────────────── */

/** GET /api/fleet-view/trips/history */
export const getTripsHistory = ({ site, vehicle, from, to, limit, signal } = {}) =>
  get('/api/fleet-view/trips/history', {
    params: { site, vehicle, from, to, limit },
    signal,
    schema: 'TripsHistoryResponseSchema',
    importer: () => import('../schemas/tripsHistory.schema.js'),
  });

/** GET /api/fleet-view/places/questions */
export const getPlaceQuestions = ({ signal } = {}) =>
  get('/api/fleet-view/places/questions', {
    signal,
    schema: 'PlaceQuestionsResponseSchema',
    importer: () => import('../schemas/tripsHistory.schema.js'),
  });

/** POST /api/fleet-view/places/questions/:id — name the place. */
export const answerPlaceQuestion = async (id, answer, { signal } = {}) => {
  try {
    const res = await apiClient.post(
      `/api/fleet-view/places/questions/${encodeURIComponent(id)}`,
      answer,
      { signal },
    );
    return bodyOf(res);
  } catch (error) {
    throw ApiError.from(error);
  }
};

/* ── §8 Fuel and mileage ──────────────────────────────────────────────── */

/** GET /api/fleet-view/mileage */
export const getMileage = ({ groupBy, from, to, vehicle, signal } = {}) =>
  get('/api/fleet-view/mileage', {
    params: { groupBy, from, to, vehicle },
    signal,
    schema: 'MileageResponseSchema',
    importer: () => import('../schemas/mileageV2.schema.js'),
  });

/** GET /api/fuel-integrity/windows */
export const getFuelIntegrityWindows = ({ vehicle, from, to, signal } = {}) =>
  get('/api/fuel-integrity/windows', {
    params: { vehicle, from, to },
    signal,
    schema: 'FuelIntegrityResponseSchema',
    importer: () => import('../schemas/mileageV2.schema.js'),
  });

/* ── §10 The daily digest ────────────────────────────────────────────── */

/** GET /api/fleet-view/digest */
export const getDigest = ({ date, signal } = {}) =>
  get('/api/fleet-view/digest', {
    params: { date },
    signal,
    schema: 'DigestResponseSchema',
    importer: () => import('../schemas/digestV2.schema.js'),
  });

/* ── §11 The vendor accounts ──────────────────────────────────────────── */

/**
 * The vendor accounts, as { items } of AccountLinkStateSchema rows. Contract §11's
 * /fleet-view/accounts/link-state was never built; the FleetEdge link-health
 * endpoint (the one the header icon and Settings read) carries the same facts.
 */
export const getAccountsLinkState = async ({ signal } = {}) => {
  const data = await get('/api/fleetedge/accounts/link-health', {
    signal,
    schema: 'fleetLinkHealthSchema',
    importer: () => import('../schemas/fleetLinkHealth.schema.js'),
  });
  return { items: linkStateItems(data) };
};

/* ── §4 Intelligence ──────────────────────────────────────────────────── */

const importIntelligence = () => import('../schemas/intelligence.schema.js');

/** GET /api/intelligence/summary */
export const getIntelligenceSummary = ({ from, to, signal } = {}) =>
  get('/api/intelligence/summary', {
    params: { from, to },
    signal,
    schema: 'IntelligenceSummaryResponseSchema',
    importer: importIntelligence,
  });

/** GET /api/intelligence/issues */
export const getIntelligenceIssues = ({ from, to, page, limit, signal } = {}) =>
  get('/api/intelligence/issues', {
    params: { from, to, page, limit },
    signal,
    schema: 'IntelligenceIssuesResponseSchema',
    importer: importIntelligence,
  });

/** GET /api/intelligence/report-cards */
export const getReportCards = ({ subject, page, limit, from, to, signal } = {}) =>
  get('/api/intelligence/report-cards', {
    params: { subject, page, limit, from, to },
    signal,
    schema: 'ReportCardsResponseSchema',
    importer: importIntelligence,
  });

/** GET /api/intelligence/instances */
export const getInstances = ({ kind, page, limit, from, to, vehicle, driver, signal } = {}) =>
  get('/api/intelligence/instances', {
    params: { kind, page, limit, from, to, vehicle, driver },
    signal,
    schema: 'InstancesResponseSchema',
    importer: importIntelligence,
  });

export const fleetViewService = {
  getVehicleNow,
  getWhereNext,
  getVehicleTrack,
  getMapPlaces,
  getCampuses,
  getNearbyHelp,
  getTripsHistory,
  getPlaceQuestions,
  answerPlaceQuestion,
  getMileage,
  getFuelIntegrityWindows,
  getDigest,
  getAccountsLinkState,
  getIntelligenceSummary,
  getIntelligenceIssues,
  getReportCards,
  getInstances,
};

export default fleetViewService;
