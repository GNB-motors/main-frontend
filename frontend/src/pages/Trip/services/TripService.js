import apiClient from '../../../utils/axiosConfig';

class TripService {
  /**
   * Submit complete journey with all data at once (New single submission pattern)
   * @param {Object} journeyData - Complete journey data
   * @param {Object} files - Files object with file references
   * @returns {Promise} API response with created journey
   */
  static async submitCompleteJourney(journeyData, files) {
    try {
      const formData = new FormData();

      // Add journeyData as JSON string
      formData.append('journeyData', JSON.stringify(journeyData));
      console.log('📦 Journey data appended to FormData');

      // Track files added
      let fileCount = 0;

      // Add odometer image
      if (files.odometer_image) {
        formData.append('odometer_image', files.odometer_image);
        console.log('✅ Added odometer_image to FormData:', files.odometer_image.name || 'unnamed file');
        fileCount++;
      }

      // Add fuel slip files (using tempId as field name)
      if (journeyData.fuelLogs) {
        journeyData.fuelLogs.forEach((fuelLog) => {
          if (fuelLog.tempId && files[fuelLog.tempId]) {
            formData.append(fuelLog.tempId, files[fuelLog.tempId]);
            console.log('✅ Added fuel file to FormData:', fuelLog.tempId, files[fuelLog.tempId].name || 'unnamed');
            fileCount++;
          } else {
            console.log('⚠️ No file found for fuel tempId:', fuelLog.tempId, 'available keys:', Object.keys(files));
          }
        });
      }

      // Add weight certificate files (using tempId as field name)
      if (journeyData.weightSlipTrips) {
        journeyData.weightSlipTrips.forEach((trip) => {
          if (trip.tempId && files[trip.tempId]) {
            formData.append(trip.tempId, files[trip.tempId]);
            console.log('✅ Added weight cert file to FormData:', trip.tempId, files[trip.tempId].name || 'unnamed');
            fileCount++;
          } else {
            console.log('⚠️ No file found for weight slip tempId:', trip.tempId, 'available keys:', Object.keys(files));
          }
        });
      }

      console.log('📤 Total files in FormData:', fileCount);

      const response = await apiClient.post('/api/trips/submit-complete-journey', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3 minutes for complete submission
      });

      return response.data;
    } catch (error) {
      console.error('Failed to submit complete journey:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Initiate a new trip (PLANNED) - Legacy method, kept for backward compatibility
   * @param {Object} data - { vehicleId, driverId }
   * @returns {Promise} API response with created trip
   */
  static async initiateTrip({ vehicleId, driverId }) {
    try {
      const response = await apiClient.post('/api/trips/initiate', { vehicleId, driverId });
      return response.data;
    } catch (error) {
      console.error('Failed to initiate trip:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Associate a document with a trip
   * @param {string} tripId - Trip ID
   * @param {string} documentType - Document type (ODOMETER, FUEL_SLIP, WEIGHT_CERT)
   * @param {string} documentId - Document ID (from DocumentService)
   * @param {Object} [ocrData] - Optional OCR data
   * @returns {Promise} API response
   */
  static async uploadDocument(tripId, documentType, documentId, ocrData) {
    try {
      const body = {
        tripId,
        documentType,
        documentId,
        ocrExtracted: ocrData || undefined
      };
      const response = await apiClient.post(`/api/trips/${tripId}/upload-documents`, body);
      return response.data;
    } catch (error) {
      console.error('Failed to associate document:', error);
      throw error.response?.data || error;
    }
  }
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

      const response = await apiClient.get(`/api/trips?${queryParams.toString()}`);
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
      const response = await apiClient.post('/api/trips/direct-start', tripData);
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
      const response = await apiClient.post(`/api/trips/${tripId}/end`, endData);
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
      const response = await apiClient.get(`/api/trips/${tripId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trip:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Update trip details
   * @param {string} tripId - Trip ID
   * @param {Object} updateData - Trip update data
   * @returns {Promise} API response with updated trip
   */
  static async updateTrip(tripId, updateData) {
    try {
      const response = await apiClient.patch(`/api/trips/${tripId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update trip:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Cancel a trip
   * @param {string} tripId - Trip ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise} API response
   */
  static async cancelTrip(tripId, reason) {
    try {
      const response = await apiClient.post(`/api/trips/${tripId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Failed to cancel trip:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get trip statistics
   * @param {Object} params - Query parameters for date range
   * @returns {Promise} API response with statistics
   */
  static async getTripStats(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await apiClient.get(`/api/trips/stats?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trip stats:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Fetch list of vehicles for trip creation
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of vehicles to fetch (default: 100)
   * @param {string} params.status - Filter by status (AVAILABLE, ON_TRIP, MAINTENANCE)
   * @param {string} params.search - Search term
   * @returns {Promise} API response with vehicles list
   */
  static async getVehicles(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);

      const response = await apiClient.get(`/api/vehicles?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Fetch list of drivers for trip creation
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of drivers to fetch (default: 100)
   * @param {string} params.status - Filter by status (PENDING, ACTIVE, SUSPENDED)
   * @param {string} params.search - Search term
   * @returns {Promise} API response with drivers list
   */
  static async getDrivers(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('role', 'DRIVER'); // Only fetch drivers
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);

      const response = await apiClient.get(`/api/employees?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get routes for trip creation
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with routes list
   */
  static async getRoutes(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);

      const response = await apiClient.get(`/api/routes?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Submit trip - finalize and mark submitted on server
   * @param {string} tripId
   * @param {Object} finalData - optional { startOdometer, endOdometer }
   */
  static async submitTrip(tripId, finalData = {}) {
    try {
      const response = await apiClient.post(`/api/trips/${tripId}/submit`, finalData);
      return response.data;
    } catch (error) {
      console.error('Failed to submit trip:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get vehicle by ID
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise} API response with vehicle details
   */
  static async getVehicleById(vehicleId) {
    try {
      const response = await apiClient.get(`/api/vehicles/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch vehicle by ID:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get driver/employee by ID
   * @param {string} driverId - Driver ID
   * @returns {Promise} API response with driver details
   */
  static async getDriverById(driverId) {
    try {
      const response = await apiClient.get(`/api/employees/${driverId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch driver by ID:', error);
      throw error.response?.data || error;
    }
  }
}

export default TripService;

/**
 * Add Processing Phase API methods
 */

// PATCH for update-ocr-data (corrections array)
TripService.updateOcrData = async function(tripId, correctionsPayload) {
  try {
    const response = await apiClient.patch(`/api/trips/${tripId}/update-ocr-data`, correctionsPayload);
    return response.data;
  } catch (error) {
    console.error('Failed to update OCR data:', error);
    throw error.response?.data || error;
  }
};

// POST for assign-routes (routeIds, totalFuel)
TripService.assignRoutes = async function(tripId, assignPayload) {
  try {
    const response = await apiClient.post(`/api/trips/${tripId}/assign-routes`, assignPayload);
    return response.data;
  } catch (error) {
    console.error('Failed to assign routes:', error);
    throw error.response?.data || error;
  }
};

// PATCH for enter-revenue (revenues array)
TripService.enterRevenue = async function(tripId, revenuePayload) {
  try {
    const response = await apiClient.patch(`/api/trips/${tripId}/enter-revenue`, revenuePayload);
    return response.data;
  } catch (error) {
    console.error('Failed to enter revenue:', error);
    throw error.response?.data || error;
  }
};

// PATCH for enter-expenses (expenses array)
TripService.enterExpenses = async function(tripId, expensesPayload) {
  try {
    const response = await apiClient.patch(`/api/trips/${tripId}/enter-expenses`, expensesPayload);
    return response.data;
  } catch (error) {
    console.error('Failed to enter expenses:', error);
    throw error.response?.data || error;
  }
};
