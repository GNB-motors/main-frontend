/**
 * Vendor, material-compatibility and ERP settings - API Integration Layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/masters';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const ErpMasterService = {
  // ─── Vendors ──────────────────────────────────────────────────────────────
  getVendors: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/vendors`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch vendors');
    }
  },

  createVendor: async (data) => {
    try {
      const response = await apiClient.post(`${BASE}/vendors`, data);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to create vendor');
    }
  },

  updateVendor: async (vendorId, data) => {
    try {
      const response = await apiClient.patch(`${BASE}/vendors/${vendorId}`, data);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to update vendor');
    }
  },

  /** Blacklisting is a hard block on placement — a reason is mandatory. */
  setBlacklist: async (vendorId, { isBlacklisted, reason }) => {
    try {
      const response = await apiClient.post(`${BASE}/vendors/${vendorId}/blacklist`, {
        isBlacklisted,
        ...(reason ? { reason } : {}),
      });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to update the blacklist');
    }
  },

  deactivateVendor: async (vendorId) => {
    try {
      const response = await apiClient.delete(`${BASE}/vendors/${vendorId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to deactivate vendor');
    }
  },

  // ─── Material compatibility ───────────────────────────────────────────────
  getCompatibility: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/material-compatibility`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch compatibility rules');
    }
  },

  saveCompatibility: async (data) => {
    try {
      const response = await apiClient.post(`${BASE}/material-compatibility`, data);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to save the compatibility rule');
    }
  },

  deleteCompatibility: async (compatId) => {
    try {
      const response = await apiClient.delete(`${BASE}/material-compatibility/${compatId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to delete the compatibility rule');
    }
  },

  // ─── Settings ─────────────────────────────────────────────────────────────
  getSettings: async () => {
    try {
      const response = await apiClient.get(`${BASE}/settings`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch settings');
    }
  },

  updateSettings: async (data) => {
    try {
      const response = await apiClient.patch(`${BASE}/settings`, data);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to save settings');
    }
  },
};

export default ErpMasterService;
