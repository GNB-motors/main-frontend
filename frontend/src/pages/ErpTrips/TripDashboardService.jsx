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
}

export default TripDashboardService;
