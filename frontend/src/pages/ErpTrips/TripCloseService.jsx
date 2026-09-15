/**
 * Trip Close (ISOCL ERP Stage 6) — API layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/trips';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const TripCloseService = {
  getPendingClose: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/pending-close`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch pending-close trips');
    }
  },

  getTrips: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch trips');
    }
  },

  getById: async (tripId) => {
    try {
      const response = await apiClient.get(`${BASE}/${tripId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch the trip');
    }
  },

  closeTrip: async (tripId, payload) => {
    try {
      const response = await apiClient.post(`${BASE}/${tripId}/close`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to close the trip');
    }
  },

  updateUnloadDate: async (tripId, payload) => {
    try {
      const response = await apiClient.patch(`${BASE}/${tripId}/unload-date`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to update unload date');
    }
  },
};

export default TripCloseService;
