/**
 * CN Updation (ISOCL ERP Stage 5) — API layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/consignments';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const ConsignmentService = {
  getPending: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/pending`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch pending CN trips');
    }
  },

  getConsignments: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch consignments');
    }
  },

  getById: async (cnId) => {
    try {
      const response = await apiClient.get(`${BASE}/${cnId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch the consignment');
    }
  },

  uploadBilty: async ({ tripId, file }) => {
    try {
      const form = new FormData();
      form.append('tripId', tripId);
      form.append('bilty', file);
      const response = await apiClient.post(`${BASE}/upload-bilty`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to upload bilty');
    }
  },

  saveCn: async (payload) => {
    try {
      const response = await apiClient.post(BASE, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to save CN');
    }
  },

  updateCn: async (cnId, payload) => {
    try {
      const response = await apiClient.patch(`${BASE}/${cnId}`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to update CN');
    }
  },

  getBiltyUrl: async (cnId) => {
    try {
      const response = await apiClient.get(`${BASE}/${cnId}/bilty`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to open bilty');
    }
  },
};

export default ConsignmentService;
