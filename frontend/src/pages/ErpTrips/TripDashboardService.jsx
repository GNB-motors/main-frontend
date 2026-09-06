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
}

export default TripDashboardService;
