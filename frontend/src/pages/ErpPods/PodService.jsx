/**
 * POD / Challan collection (ISOCL ERP Stage 7) — API layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/pods';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const PodService = {
  getPending: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/pending`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch pending PODs');
    }
  },

  getPods: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch PODs');
    }
  },

  getAgeingReport: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/ageing-report`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch POD ageing report');
    }
  },

  upload: async ({ tripId, file }) => {
    try {
      const form = new FormData();
      form.append('tripId', tripId);
      form.append('pod', file);
      const response = await apiClient.post(`${BASE}/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to upload POD document');
    }
  },

  record: async (payload) => {
    try {
      const response = await apiClient.post(BASE, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to record POD');
    }
  },

  update: async (podId, payload) => {
    try {
      const response = await apiClient.patch(`${BASE}/${podId}`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to update POD');
    }
  },
};

export default PodService;
