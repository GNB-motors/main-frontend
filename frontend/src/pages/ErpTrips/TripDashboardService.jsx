import apiClient from '../../utils/axiosConfig';

class TripDashboardService {
  static async listTrips(params = {}) {
    const response = await apiClient.get('/api/erp/trips', { params });
    return response.data;
  }

  static async getTripById(id) {
    const response = await apiClient.get(`/api/erp/trips/${id}`);
    return response.data.data;
  }

  /**
   * State-aware finance rollup for the Trip Detail Financials section:
   * { receivable, payable, margin, approvals, capabilities }. Loaded alongside
   * the trip so the operational view never waits on the finance reads.
   */
  static async getTripFinance(id) {
    const response = await apiClient.get(`/api/erp/trips/${id}/finance`);
    return response.data.data;
  }

  // Pillar 3 — telematics leg breakdown + manual recompute.
  static async getTelematicsSegments(id) {
    const response = await apiClient.get(`/api/erp/trips/${id}/segments`);
    return response.data.data;
  }

  static async recomputeTelematics(id) {
    const response = await apiClient.post(`/api/erp/trips/${id}/telematics/recompute`);
    return response.data.data;
  }

  /** Trips queued against a tanker but not yet running. */
  static async listPlanned(params = {}) {
    const response = await apiClient.get('/api/erp/trips/planned', { params });
    return response.data.data;
  }

  /**
   * Start a queued trip. This is the instant that cuts the previous trip's
   * telematics window — placing the trip did not.
   */
  static async startTrip(id, { startedAt } = {}) {
    const response = await apiClient.post(`/api/erp/trips/${id}/start`, {
      ...(startedAt ? { startedAt } : {}),
    });
    return response.data.data;
  }

  /** Trips still accruing kilometres long after their load came off. */
  static async listStaleWindows(params = {}) {
    const response = await apiClient.get('/api/erp/trips/stale-windows', { params });
    return response.data.data;
  }

  /**
   * Close a stale window back at unload. The running after that point becomes
   * unattributed and surfaces in the Tour section.
   */
  static async resolveWindow(id) {
    const response = await apiClient.post(`/api/erp/trips/${id}/resolve-window`);
    return response.data.data;
  }

  // B2.3 — trip-window analytics read model (planned vs per-leg actual km/fuel).
  static async getTripWindows(params = {}, { signal } = {}) {
    const response = await apiClient.get('/api/erp/trips/windows', { params, signal });
    return response.data.data;
  }
}

export default TripDashboardService;
