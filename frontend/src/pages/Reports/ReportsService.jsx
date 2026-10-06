import apiClient from '../../utils/axiosConfig'; // Use the configured axios instance

/**
 * Service functions for fetching report data.
 */
export const ReportsService = {
  /**
   * Vehicle fuel & efficiency report (server-paginated).
   * @param {object} params - { page, limit, startDate, endDate, vehicleId, vehicleType }
   * @returns {Promise<{ data: Array, meta: Object, summary: Object }>}
   */
  getVehicleReports: async (params = {}, signal) => {
    try {
      const response = await apiClient.get(`api/reports/vehicles`, { params, signal });
      return {
        data: Array.isArray(response.data?.data) ? response.data.data : [],
        meta: response.data?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 },
        summary: response.data?.summary || null,
      };
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      console.error('API Error fetching vehicle reports:', error.response?.data || error.message);
      throw (
        error.response?.data || {
          detail: 'Network error or server unavailable while fetching vehicle reports.',
        }
      );
    }
  },

  /**
   * Every row of a server-paginated report, for exports. Walks pages at the
   * API's max page size until `meta.totalPages` is reached.
   * @param {(params: object) => Promise<{ data: Array, meta: Object }>} fetchPage
   * @param {object} params - active filters
   * @returns {Promise<Array>}
   */
  fetchAllReportRows: async (fetchPage, params = {}) => {
    const rows = [];
    let page = 1;
    let totalPages = 1;
    do {
      const { data, meta } = await fetchPage({ ...params, page, limit: 1000 });
      rows.push(...data);
      totalPages = meta?.totalPages || 1;
      page += 1;
    } while (page <= totalPages);
    return rows;
  },

  /**
   * Flat mileage-interval report across all vehicles.
   * @param {object} params - { page, limit, startDate, endDate, vehicleId, driverId, search, status }
   * @returns {Promise<{ data: Array, meta: Object }>}
   */
  getMileageIntervalReports: async (params = {}) => {
    try {
      const response = await apiClient.get(`api/reports/mileage-intervals`, { params });

      if (response.data && response.data.status === 'success') {
        return {
          data: Array.isArray(response.data.data) ? response.data.data : [],
          meta: response.data.meta || { total: 0, page: 1, limit: 20, totalPages: 0 },
        };
      }

      return {
        data: response.data?.data || [],
        meta: response.data?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
    } catch (error) {
      console.error(
        'API Error fetching mileage interval reports:',
        error.response?.data || error.message,
      );
      throw (
        error.response?.data || {
          detail: 'Network error or server unavailable while fetching mileage report.',
        }
      );
    }
  },

  /**
   * Trip Economics reports (API contract §6). These are NOT paginated — they
   * return `data = { rows, total, truncated?, totals? }` capped at 5,000 rows,
   * so do not send page/limit (unknown params are rejected). `totals` surfaces
   * as `summary` for the footer.
   * @returns {Promise<{ data: Array, total: number, truncated: boolean, summary: Object|null }>}
   */
  _getTripReport: async (endpoint, params = {}, label = 'report') => {
    try {
      const response = await apiClient.get(endpoint, { params });
      const body = response.data?.data ?? response.data ?? {};
      const rows = Array.isArray(body.rows) ? body.rows : Array.isArray(body) ? body : [];
      return {
        data: rows,
        total: typeof body.total === 'number' ? body.total : rows.length,
        truncated: Boolean(body.truncated),
        summary: body.totals || null,
      };
    } catch (error) {
      console.error(`API Error fetching ${label}:`, error.response?.data || error.message);
      throw (
        error.response?.data || {
          detail: `Network error or server unavailable while fetching ${label}.`,
        }
      );
    }
  },

  getFuelCycles: (params = {}) =>
    ReportsService._getTripReport('api/reports/fuel-cycles', params, 'fuel cycles'),
  getNonBusiness: (params = {}) =>
    ReportsService._getTripReport('api/reports/non-business', params, 'non-business report'),
  getRunningCost: (params = {}) =>
    ReportsService._getTripReport('api/reports/running-cost', params, 'running-cost report'),

  /**
   * Generic filtered CSV export — call any report `/export` endpoint with the
   * same filters used by the table. Reuse from Mileage, Driver, etc.
   * @param {string} endpoint - e.g. 'api/reports/mileage-intervals/export'
   * @param {object} params - active filters only
   * @returns {Promise<Blob>}
   */
  exportReportCsv: async (endpoint, params = {}) => {
    try {
      const response = await apiClient.get(endpoint, {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error(
        `API Error exporting report (${endpoint}):`,
        error.response?.data || error.message,
      );
      const data = error.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const parsed = JSON.parse(text);
          throw parsed;
        } catch (parseErr) {
          if (parseErr && (parseErr.detail || parseErr.message)) throw parseErr;
        }
      }
      throw data || { detail: 'Network error or server unavailable while exporting report.' };
    }
  },

  /**
   * Driver fuel & efficiency report (server-paginated).
   * @param {object} params - { page, limit, startDate, endDate, driverId }
   * @returns {Promise<{ data: Array, meta: Object, summary: Object }>}
   */
  getDriverReports: async (params = {}, signal) => {
    try {
      const response = await apiClient.get(`api/reports/drivers`, { params, signal });
      return {
        data: Array.isArray(response.data?.data) ? response.data.data : [],
        meta: response.data?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 },
        summary: response.data?.summary || null,
      };
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      console.error('API Error fetching driver reports:', error.response?.data || error.message);
      throw (
        error.response?.data || {
          detail: 'Network error or server unavailable while fetching driver reports.',
        }
      );
    }
  },

  /**
   * Fetches employees list for dropdowns.
   * @param {object} params - Optional query parameters { limit }.
   * @returns {Promise<Array>} - Array of employee data.
   */
  getEmployees: async (params = { limit: 100 }) => {
    try {
      const response = await apiClient.get(`api/employees`, { params });

      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return response.data?.data || [];
    } catch (error) {
      console.error('API Error fetching employees:', error.response?.data || error.message);
      throw (
        error.response?.data || {
          detail: 'Network error or server unavailable while fetching employees.',
        }
      );
    }
  },

  // ─── Extension API ───────────────────────────────────────────────────────

  /**
   * Fetches the current fuel comparison sync status.
   * @returns {Promise<Object>} - { pending, inProgress, completed, failed, flagged, total, lastSyncAt, isUpToDate }
   */
  getExtensionStatus: async () => {
    try {
      const response = await apiClient.get(`api/extension/status`);
      return response.data?.data || response.data || {};
    } catch (error) {
      console.error('API Error fetching extension status:', error.response?.data || error.message);
      throw error.response?.data || { detail: 'Network error fetching sync status.' };
    }
  },

  /**
   * Fetches flagged fuel comparison records (bill > FleetEdge).
   * @param {object} params - { page, limit }
   * @returns {Promise<Object>} - { records, total, page, limit, totalPages }
   */
  getExtensionFlagged: async (params = {}) => {
    try {
      const response = await apiClient.get(`api/extension/flagged`, { params });
      return (
        response.data?.data ||
        response.data || { records: [], total: 0, page: 1, limit: 20, totalPages: 0 }
      );
    } catch (error) {
      console.error('API Error fetching flagged records:', error.response?.data || error.message);
      throw error.response?.data || { detail: 'Network error fetching flagged records.' };
    }
  },

  /**
   * Fetches all fuel comparison records with optional filtering.
   * @param {object} params - { page, limit, vehicleId, driverId, flaggedOnly }
   * @returns {Promise<Object>} - { records, total, page, limit, totalPages }
   */
  getExtensionComparisons: async (params = {}) => {
    try {
      const response = await apiClient.get(`api/extension/comparisons`, { params });
      return (
        response.data?.data ||
        response.data || { records: [], total: 0, page: 1, limit: 20, totalPages: 0 }
      );
    } catch (error) {
      console.error('API Error fetching comparisons:', error.response?.data || error.message);
      throw error.response?.data || { detail: 'Network error fetching comparisons.' };
    }
  },

  getPendingReviewTasks: async (params = {}) => {
    try {
      const response = await apiClient.get(`api/extension/fuel-comparison/pending-review`, {
        params,
      });
      return (
        response.data?.data ||
        response.data || { records: [], total: 0, page: 1, limit: 20, totalPages: 0 }
      );
    } catch (error) {
      console.error(
        'API Error fetching pending review tasks:',
        error.response?.data || error.message,
      );
      throw error.response?.data || { detail: 'Network error fetching pending review tasks.' };
    }
  },

  approveReviewTask: async (taskId, updates = {}) => {
    try {
      const response = await apiClient.put(
        `api/extension/fuel-comparison/${taskId}/review`,
        updates,
      );
      return response.data?.data || response.data || {};
    } catch (error) {
      console.error('API Error approving review task:', error.response?.data || error.message);
      throw error.response?.data || { detail: 'Network error approving task.' };
    }
  },

  /** GET /api/extension/fleetedge/status — multi-account connectivity info */
  getFleetEdgeConnectivity: async () => {
    try {
      const response = await apiClient.get('api/extension/fleetedge/status');
      return response.data?.data || response.data || { accounts: [], pull: {} };
    } catch (error) {
      console.error(
        'API Error fetching FleetEdge connectivity:',
        error.response?.data || error.message,
      );
      return { accounts: [], pull: {} };
    }
  },

  /** GET /api/extension/user-errors — unacknowledged errors (includes FLEETEDGE_REAUTH_REQUIRED) */
  getUserErrors: async () => {
    try {
      const response = await apiClient.get('api/extension/user-errors');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('API Error fetching user errors:', error.response?.data || error.message);
      return [];
    }
  },

  /** POST /api/extension/fleetedge/process-tasks — on-demand pull + backfill */
  triggerPullNow: async () => {
    try {
      const response = await apiClient.post('api/extension/fleetedge/process-tasks');
      return response.data?.data || response.data || {};
    } catch (error) {
      console.error('API Error triggering pull:', error.response?.data || error.message);
      throw error.response?.data || { detail: 'Network error triggering pull.' };
    }
  },
};
