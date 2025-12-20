import axios from '../../utils/axiosConfig';

class TripService {
  /**
   * Fetch paginated trips list with optional filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.status - Filter by status (PLANNED, ONGOING, COMPLETED, CANCELLED)
   * @param {string} params.driverId - Filter by driver ID
   * @param {string} params.vehicleId - Filter by vehicle ID
   * @param {string} params.startDate - ISO date string
   * @param {string} params.endDate - ISO date string
   * @returns {Promise} API response with trips data
   */
  static async getAllTrips(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.driverId) queryParams.append('driverId', params.driverId);
      if (params.vehicleId) queryParams.append('vehicleId', params.vehicleId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await axios.get(`/api/trips?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Create and immediately start a trip
   * @param {Object} tripData - Trip creation data
   * @param {string} tripData.vehicleId - Vehicle ID (required)
   * @param {string} tripData.driverId - Driver ID (required)
   * @param {string} tripData.routeSource - Source location (required)
   * @param {string} tripData.routeDestination - Destination location (required)
   * @param {number} tripData.startOdometer - Starting odometer reading (optional)
   * @param {string} tripData.weighInWeight - Weigh-in weight (optional)
   * @returns {Promise} API response with created trip
   */
  static async directStartTrip(tripData) {
    try {
      console.log('TripService: Making request to /api/trips/direct-start with data:', tripData);
      const response = await axios.post('/api/trips/direct-start', tripData);
      console.log('TripService: Response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to start trip:', error);
      console.error('Error details:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * End an ongoing trip
   * @param {string} tripId - Trip ID
   * @param {Object} endData - End trip data
   * @param {number} endData.endOdometer - Ending odometer reading (required)
   * @param {number} endData.startOdometer - Starting odometer reading (optional, for validation)
   * @returns {Promise} API response with updated trip
   */
  static async endTrip(tripId, endData) {
    try {
      const response = await axios.post(`/api/trips/${tripId}/end`, endData);
      return response.data;
    } catch (error) {
      console.error('Failed to end trip:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get trip by ID
   * @param {string} tripId - Trip ID
   * @returns {Promise} API response with trip details
   */
  static async getTripById(tripId) {
    try {
      const response = await axios.get(`/api/trips/${tripId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trip:', error);
      throw error.response?.data || error;
    }
  }
}

export default TripService;
