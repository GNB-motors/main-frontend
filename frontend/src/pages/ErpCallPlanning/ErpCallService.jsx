/**
 * ERP Call Planning (Stage 1) - API Integration Layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/calls';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const ErpCallService = {
  // ─── Tasks ────────────────────────────────────────────────────────────────

  /** @param {Object} params - { date, from, to, kamId, partyId, status, outcome, page, limit } */
  getTasks: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/tasks`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch call tasks');
    }
  },

  getTaskById: async (taskId) => {
    try {
      const response = await apiClient.get(`${BASE}/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch call task');
    }
  },

  /**
   * Record a call result.
   * FOLLOW_UP / NO_RESPONSE need both remarks and nextFollowUpDate; the server
   * rejects the request otherwise. SURE_ORDER returns a doDraft for Stage 2.
   */
  recordOutcome: async (taskId, { outcome, remarks, nextFollowUpDate }) => {
    try {
      const body = { outcome };
      if (remarks) body.remarks = remarks;
      if (nextFollowUpDate) body.nextFollowUpDate = nextFollowUpDate;
      const response = await apiClient.post(`${BASE}/tasks/${taskId}/outcome`, body);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to record outcome');
    }
  },

  createManualTask: async (data) => {
    try {
      const response = await apiClient.post(`${BASE}/tasks`, data);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to create call task');
    }
  },

  // ─── Schedules ────────────────────────────────────────────────────────────

  getSchedules: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/schedules`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch call schedules');
    }
  },

  /** Upsert — also syncs the KAM onto the party master server-side. */
  saveSchedule: async (data) => {
    try {
      const response = await apiClient.post(`${BASE}/schedules`, data);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to save call schedule');
    }
  },

  deleteSchedule: async (scheduleId) => {
    try {
      const response = await apiClient.delete(`${BASE}/schedules/${scheduleId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to delete call schedule');
    }
  },

  // ─── Admin ────────────────────────────────────────────────────────────────

  /** Runs the same close+generate the nightly cron does. Idempotent. */
  generateTasks: async (forDate) => {
    try {
      const response = await apiClient.post(`${BASE}/admin/generate`, forDate ? { forDate } : {});
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to generate call tasks');
    }
  },

  getReport: async (params) => {
    try {
      const response = await apiClient.get(`${BASE}/reports`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch call report');
    }
  },
};

export default ErpCallService;
