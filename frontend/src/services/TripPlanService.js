import apiClient from '../utils/axiosConfig';
import { parseSafe } from '../schemas/validate.js';
import PlaceIntelligenceService from '../pages/PlaceHub/intelligence/PlaceIntelligenceService';

const BASE = '/api/trip-plans';
const asList = (response) => {
  const data = response.data?.data ?? response.data ?? [];
  return Array.isArray(data) ? data : data.records || data.items || [];
};
const schemas = () => import('../schemas/tripPlan.schema.js');

const unwrap = (response) => response.data?.data ?? response.data;
const parsed = async (name, response) => parseSafe(name, schemas, unwrap(response));

/**
 * Scheduled trips. A plan links to the GPS-detected trip that ran it (the server
 * matches by truck, time and place), so it shows planned vs actual.
 */
export const TripPlanService = {
  list: async (params = {}, { signal } = {}) =>
    parsed('tripPlanListSchema', await apiClient.get(BASE, { params, signal })),

  create: async (body, { signal } = {}) =>
    parsed('tripPlanSchema', await apiClient.post(BASE, body, { signal })),

  cancel: async ({ id, reason }, { signal } = {}) =>
    parsed(
      'tripPlanSchema',
      await apiClient.post(`${BASE}/${id}/cancel`, reason ? { reason } : {}, { signal }),
    ),

  link: async ({ id, autoTripId }, { signal } = {}) =>
    parsed(
      'tripPlanSchema',
      await apiClient.post(`${BASE}/${id}/link`, { autoTripId }, { signal }),
    ),

  unlink: async ({ id }, { signal } = {}) =>
    parsed('tripPlanSchema', await apiClient.post(`${BASE}/${id}/unlink`, {}, { signal })),

  /** Trips no plan links to — what a person links a plan to by hand. */
  unplannedTrips: async (params = {}, { signal } = {}) =>
    parsed(
      'unplannedTripsSchema',
      await apiClient.get(`${BASE}/unplanned-trips`, { params, signal }),
    ),

  /** Trucks, drivers and confirmed places for the trip forms. Drivers are best-effort. */
  pickLists: async ({ signal } = {}) => {
    const [vehicles, employees, sites] = await Promise.all([
      apiClient.get('/api/vehicles', { params: { limit: 500 }, signal }).then(asList),
      apiClient
        .get('/api/employees', { params: { limit: 1000 }, signal })
        .then(asList)
        // A manager without employee access still schedules trips, just without a driver list.
        .catch(() => []),
      PlaceIntelligenceService.listSites({ status: 'CONFIRMED', limit: 500 }, { signal }),
    ]);
    return { vehicles, employees, sites: sites?.records || [] };
  },
};

export default TripPlanService;
