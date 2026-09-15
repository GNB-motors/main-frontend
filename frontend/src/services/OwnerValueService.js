import apiClient from '../utils/axiosConfig';

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
    console.error(`API Error ${path}:`, error.response?.data || error.message);
    throw error.response?.data || { detail: `Could not fetch ${path}.` };
  }
};

export const OwnerValueService = {
  /** Fleet-wide ₹ rollup: theft/bill-fraud/idling/detour/DEF/fuel + top-5 waste vehicles. */
  getMoney: (params = {}, signal) => get('/api/owner-value/money', params, signal),

  /** 0–100 fleet health score with weighted penalty components + grade A–D. */
  getHealthScore: (signal) => get('/api/owner-value/health-score', {}, signal),

  /** Per-vehicle loaded vs empty km with ₹ waste, plus fleet aggregate. */
  getUtilization: (params = {}, signal) => get('/api/owner-value/utilization', params, signal),

  /** DUE_SOON / OVERDUE vehicles with downtime ₹ exposure. */
  getDowntimeRisk: (signal) => get('/api/owner-value/downtime-risk', {}, signal),

  /** Documents expired / expiring within `days` (default 30) with fine exposure. */
  getComplianceRisk: (params = {}, signal) => get('/api/owner-value/compliance-risk', params, signal),

  /** Per-trip P&L estimate. tripId required. */
  getTripPnl: (params, signal) => get('/api/owner-value/trip-pnl', params, signal),
};

export default OwnerValueService;
