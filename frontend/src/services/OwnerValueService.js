import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';

/**
 * OwnerValueService — the ₹ layer. All six owner-value endpoints are
 * compute-on-read estimates from FleetEdge telemetry + configured prices;
 * every payload carries a disclaimer. Render figures verbatim.
 */
const get = async (path, params = {}, signal) => {
  try {
    const response = await apiClient.get(path, { params, signal });
    return response.data?.data || {};
  } catch (error) {
    if (error?.code === 'ERR_CANCELED') throw error;
    throw ApiError.from(error);
  }
};

const DIGEST_SECTIONS = {
  money: (p, signal) => get('/api/owner-value/money', { from: p.from }, signal),
  healthScore: (p, signal) => get('/api/owner-value/health-score', {}, signal),
  utilization: (p, signal) => get('/api/owner-value/utilization', { from: p.from }, signal),
  downtimeRisk: (p, signal) => get('/api/owner-value/downtime-risk', {}, signal),
  fuelEfficiency: (p, signal) =>
    get('/api/owner-value/fuel-efficiency', { days: p.efficiencyDays }, signal),
  refuellingToday: (p, signal) => get('/api/owner-value/refuelling-today', {}, signal),
  fleetCalendar: (p, signal) =>
    get('/api/owner-value/fleet-calendar', { days: p.calendarDays }, signal),
  morningBrief: (p, signal) => get('/api/owner-value/morning-brief', {}, signal),
};

/** The digest's shape built from the eight section endpoints, for a backend without /digest. */
const digestFromSections = async (params, signal) => {
  const keys = Object.keys(DIGEST_SECTIONS);
  const settled = await Promise.allSettled(keys.map((k) => DIGEST_SECTIONS[k](params, signal)));
  const digest = { errors: {} };
  settled.forEach((r, i) => {
    digest[keys[i]] = r.status === 'fulfilled' ? r.value : null;
    if (r.status === 'rejected') digest.errors[keys[i]] = r.reason?.message || 'Failed to load';
  });
  if (signal?.aborted) throw Object.assign(new Error('canceled'), { code: 'ERR_CANCELED' });
  return digest;
};

export const OwnerValueService = {
  /**
   * Everything the Daily Digest reads from owner-value, in one request:
   * { money, healthScore, utilization, downtimeRisk, fuelEfficiency,
   *   refuellingToday, fleetCalendar, morningBrief, errors }. A section that
   * failed is null. A backend without /digest (404) is served from the eight
   * section endpoints instead; drop that once every environment has it.
   */
  getDigest: async (params = {}, signal) => {
    const p = { efficiencyDays: 7, calendarDays: 14, ...params };
    try {
      const response = await apiClient.get('/api/owner-value/digest', { params: p, signal });
      return response.data?.data || {};
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') throw error;
      if ((error?.status ?? error?.response?.status) !== 404) throw ApiError.from(error);
    }
    return digestFromSections(p, signal);
  },

  /** Fleet-wide ₹ rollup: theft/bill-fraud/idling/detour/DEF/fuel + top-5 waste vehicles. */
  getMoney: (params = {}, signal) => get('/api/owner-value/money', params, signal),

  /** 0–100 fleet health score with weighted penalty components + grade A–D. */
  getHealthScore: (signal) => get('/api/owner-value/health-score', {}, signal),

  /** Per-vehicle loaded vs empty km with ₹ waste, plus fleet aggregate. */
  getUtilization: (params = {}, signal) => get('/api/owner-value/utilization', params, signal),

  /** DUE_SOON / OVERDUE vehicles with downtime ₹ exposure. */
  getDowntimeRisk: (signal) => get('/api/owner-value/downtime-risk', {}, signal),

  /** Per-trip P&L estimate. tripId required. */
  getTripPnl: (params, signal) => get('/api/owner-value/trip-pnl', params, signal),

  /** Per-vehicle actual km/L for a window (default today), worst 4 vs fleet average. */
  getFuelEfficiency: (params = {}, signal) =>
    get('/api/owner-value/fuel-efficiency', params, signal),

  /** Today's fuel fills, tank-verification status, and low-tank-before-trip flags. */
  getRefuellingToday: (signal) => get('/api/owner-value/refuelling-today', {}, signal),

  /** Per-vehicle trip/service/document events over a date window. */
  getFleetCalendar: (params = {}, signal) => get('/api/owner-value/fleet-calendar', params, signal),

  /** One IST day's excess idling and fuel-over-expected ₹, top-5 vehicles each, with an action. */
  getMorningBrief: (params = {}, signal) => get('/api/owner-value/morning-brief', params, signal),
};

export default OwnerValueService;
