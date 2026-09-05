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

  /** Counts for one day, scoped the same way getTasks is. */
  getTaskStats: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE}/tasks/stats`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch call task stats');
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

  /** Headline counts for the schedule page. */
  getScheduleStats: async () => {
    try {
      const response = await apiClient.get(`${BASE}/schedules/stats`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch schedule stats');
    }
  },

  /**
   * Pause / resume only.
   *
   * Separate from saveSchedule on purpose: that one rewrites the KAM on the
   * party master, so routing a pause through it would silently reassign the
   * account. Never swap these two.
   */
  setScheduleStatus: async (scheduleId, { status, pausedUntil } = {}) => {
    try {
      const body = { status };
      if (status === 'PAUSED' && pausedUntil) body.pausedUntil = pausedUntil;
      const response = await apiClient.patch(`${BASE}/schedules/${scheduleId}/status`, body);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to update schedule status');
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
