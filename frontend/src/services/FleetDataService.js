import apiClient from '../utils/axiosConfig';

/**
 * FleetDataService — the Phase-3 read APIs: previously-invisible collections
 * (live statuses, push alerts, fuel ₹ spend, DEF ledger, FleetEdge coverage,
 * vehicle 360 aggregate, audit trail, service predictions).
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

const put = async (path, body = {}, signal) => {
  try {
    const response = await apiClient.put(path, body, { signal });
    return response.data?.data || {};
  } catch (error) {
    if (error?.code === 'ERR_CANCELED') throw error;
    console.error(`API Error ${path}:`, error.response?.data || error.message);
    throw error.response?.data || { detail: `Could not update ${path}.` };
  }
};

export const FleetDataService = {
  /** Latest live-status reading per vehicle (fuel%, DEF%, odo, engine hrs, service, staleness). */
  getFleetHealth: (signal) => get('/api/vehicle-health', {}, signal),

  /** One vehicle's latest reading + history for trend charts. */
  getVehicleHealth: (registrationNumber, params = {}, signal) =>
    get(`/api/vehicle-health/${encodeURIComponent(registrationNumber)}`, params, signal),

  /** Native FleetEdge alert timeline (paginated). */
  getFleetAlerts: (params = {}, signal) => get('/api/fleet-alerts', params, signal),

  /** Alert counts grouped by type for filter chips. */
  getFleetAlertSummary: (params = {}, signal) => get('/api/fleet-alerts/summary', params, signal),

  /** AdBlue/DEF claimed-vs-consumed ledger per vehicle. */
  getDefLedger: (signal) => get('/api/def-ledger', {}, signal),

  /** FleetEdge directory vs fleet master join (the onboarding gap). */
  getFleetCoverage: (signal) => get('/api/fleet-coverage', {}, signal),

  /** Vehicle 360 aggregate. */
  getVehicleProfile: (registrationNumber, signal) =>
    get(`/api/vehicle-profile/${encodeURIComponent(registrationNumber)}`, {}, signal),

  /** Service predictions, riskiest first. */
  getMaintenancePredictions: (params = {}, signal) =>
    get('/api/maintenance-predictions', params, signal),

  /** Acknowledge a service prediction (e.g. an overdue row) as reviewed. */
  acknowledgePrediction: (id, signal) =>
    put(`/api/maintenance-predictions/${encodeURIComponent(id)}/ack`, {}, signal),

  /** Org audit trail (owner only). */
  getAuditLogs: (params = {}, signal) => get('/api/audit-logs', params, signal),

  /** Latest driver fuel-efficiency leaderboard (km/L), ranked. */
  getDriverLeaderboard: (params = {}, signal) => get('/api/driver-leaderboard', params, signal),
};

export default FleetDataService;
