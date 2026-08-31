/**
 * Party Master - API Integration Layer
 * ISOCL ERP Stage 0 master data.
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/masters/parties';

/** Backend envelope is { status, data, meta }. Surface the server message on failure. */
const unwrapError = (error, fallback) => {
  // 404 here can mean "erpMasters feature is off for this org", not just "missing row".
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const PartyService = {
  /**
   * List parties.
   * @param {Object} params - { search, status, kamId, page, limit }
   */
  getParties: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch parties');
    }
  },

  getPartyById: async (partyId) => {
    try {
      const response = await apiClient.get(`${BASE}/${partyId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch party');
    }
  },

  createParty: async (data) => {
    try {
      const response = await apiClient.post(BASE, data);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to create party');
    }
  },

  updateParty: async (partyId, data) => {
    try {
      const response = await apiClient.patch(`${BASE}/${partyId}`, data);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to update party');
    }
  },

  /** Soft delete — the backend flips status to INACTIVE. */
  deactivateParty: async (partyId) => {
    try {
      const response = await apiClient.delete(`${BASE}/${partyId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to deactivate party');
    }
  },
};

export default PartyService;
