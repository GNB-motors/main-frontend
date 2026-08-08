/**
 * ERP Approvals - API Integration Layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/approvals';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const ApprovalService = {
  /** @param {Object} params - { status, type, entityType, page, limit } */
  getApprovals: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch approvals');
    }
  },

  getSummary: async () => {
    try {
      const response = await apiClient.get(`${BASE}/summary`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch approval summary');
    }
  },

  getById: async (approvalId) => {
    try {
      const response = await apiClient.get(`${BASE}/${approvalId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch approval');
    }
  },

  /** Rejection requires remarks; the server enforces it too. */
  decide: async (approvalId, { status, remarks }) => {
    try {
      const body = { status };
      if (remarks) body.remarks = remarks;
      const response = await apiClient.post(`${BASE}/${approvalId}/decide`, body);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to record decision');
    }
  },
};

export default ApprovalService;
