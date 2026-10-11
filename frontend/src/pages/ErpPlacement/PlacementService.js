/**
 * Vehicle Placement (ISOCL ERP Stage 3) - API Integration Layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/placements';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const PlacementService = {
  /** Location-wise tanker grid. Pass doId to get per-tanker compatibility flags. */
  getBoard: async ({ doId, location } = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/board`, {
        params: { ...(doId ? { doId } : {}), ...(location ? { location } : {}) },
      });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to load the placement board');
    }
  },

  /**
   * Restriction popup. Returns blocks (hard stops), warnings (each becomes an
   * approval) and info (display only).
   */
  checkRestrictions: async (payload) => {
    try {
      const response = await apiClient.post(`${BASE}/check-restrictions`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to check restrictions');
    }
  },

  placeOwn: async (payload) => {
    try {
      const response = await apiClient.post(`${BASE}/own`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to place the vehicle');
    }
  },

  placeHire: async (payload) => {
    try {
      const response = await apiClient.post(`${BASE}/hire`, payload);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to place the hire vehicle');
    }
  },

  getPlacements: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch placements');
    }
  },

  getPlacementById: async (placementId) => {
    try {
      const response = await apiClient.get(`${BASE}/${placementId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch placement');
    }
  },

  /** Deleting returns the quantity to the DO and carries the empty running forward. */
  deletePlacement: async (placementId, { reason, remarks, emptyBudgetAmount }) => {
    try {
      const response = await apiClient.delete(`${BASE}/${placementId}`, {
        data: { reason, remarks, emptyBudgetAmount },
      });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to delete the placement');
    }
  },

  getPendingEmptyLegs: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/pending-empty-legs`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch pending empty legs');
    }
  },
};

export default PlacementService;
