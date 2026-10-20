import apiClient from '../../utils/axiosConfig'; // Use the configured axios instance
import ApiError from '../../errors/ApiError';
import logger from '../../utils/logger';
import { parseSafe } from '../../schemas/validate';

const hubSchemas = () => import('../../schemas/mileageHub.schema.js');

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
      throw ApiError.from(error);
    }
  },

  /**
   * Lane km vs SAP: every lane of the owner's SAP sheet with the km trips run on it.
   * @returns {Promise<{ rows?: Array, totals?: Object }>}
   */
  getLaneKm: async ({ signal } = {}) => {
    try {
      const response = await apiClient.get('api/reports/lanes', { signal });
      return response.data?.data || response.data || {};
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
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
   * Flat mileage-interval report across all vehicles (server-paginated).
   * @param {object} params - { page, limit, startDate, endDate, vehicleId, driverId, search, status }
   * @returns {Promise<{ data: Array, meta: Object, summary: Object|null }>}
   */
  getMileageIntervalReports: async (params = {}, signal) => {
    try {
      const response = await apiClient.get(`api/reports/mileage-intervals`, { params, signal });
      return {
        data: Array.isArray(response.data?.data) ? response.data.data : [],
        meta: response.data?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 },
        summary: response.data?.summary || null,
      };
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
    }
  },

  /**
   * Trip Economics reports (API contract §6). These are NOT paginated — they
   * return `data = { rows, total, truncated?, totals? }` capped at 5,000 rows,
   * so do not send page/limit (unknown params are rejected). `totals` surfaces
   * as `summary` for the footer.
   * @returns {Promise<{ data: Array, total: number, truncated: boolean, summary: Object|null }>}
   */
  _getTripReport: async (endpoint, params = {}, signal) => {
    try {
      const response = await apiClient.get(endpoint, { params, signal });
      const body = response.data?.data ?? response.data ?? {};
      const rows = Array.isArray(body.rows) ? body.rows : Array.isArray(body) ? body : [];
      return {
        data: rows,
        total: typeof body.total === 'number' ? body.total : rows.length,
        truncated: Boolean(body.truncated),
        summary: body.totals || null,
      };
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
    }
  },

  getFuelCycles: (params = {}, signal) =>
    ReportsService._getTripReport('api/reports/fuel-cycles', params, signal),
  /**
   * One fuel cycle's trips (drop-down under a Fuel Cycles row).
   * @returns {Promise<{ cycle: Object, summary: Object|null, trips: Array }>}
   */
  getFuelCycleTrips: async (cycleId, signal) => {
    try {
      const response = await apiClient.get(
        `api/reports/fuel-cycles/${encodeURIComponent(cycleId)}/trips`,
        { signal },
      );
      const body = await parseSafe('fuelCycleTripsSchema', hubSchemas, response.data ?? null);
      const data = body?.data ?? {};
      return {
        cycle: data.cycle || null,
        summary: data.summary || null,
        trips: Array.isArray(data.trips) ? data.trips : [],
      };
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
    }
  },
  getNonBusiness: (params = {}, signal) =>
    ReportsService._getTripReport('api/reports/non-business', params, signal),
  getRunningCost: (params = {}, signal) =>
    ReportsService._getTripReport('api/reports/running-cost', params, signal),

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
      // responseType 'blob' delivers the JSON error body as a Blob too.
      const data = error.response?.data;
      let body = null;
      if (data instanceof Blob) {
        try {
          body = JSON.parse(await data.text());
        } catch {
          // Not a JSON body; the transport error below still says what failed.
        }
      }
      if (body) {
        throw new ApiError(body.message || body.detail || 'Export failed', {
          status: error.response?.status ?? null,
          requestId: error.response?.headers?.['x-request-id'] ?? null,
          body,
          code: error.code ?? null,
          cause: error,
        });
      }
      throw ApiError.from(error);
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
      throw ApiError.from(error);
    }
  },

  /**
   * Vehicles matching `query` (registration or chassis), for the Reports
   * vehicle picker. Server-searched, so a fleet of any size is reachable.
   * @returns {Promise<Array<{ id: string, label: string, sub: string }>>}
   */
  searchVehicles: async (query, { signal, limit = 20 } = {}) => {
    try {
      const response = await apiClient.get('api/vehicles', {
        params: { limit, ...(query ? { search: query } : {}) },
        signal,
      });
      const list = Array.isArray(response.data?.data) ? response.data.data : [];
      return list
        .map((v) => ({
          id: String(v._id || v.id),
          label: v.registrationNumber || v.vehicleNumber || '—',
          sub: [v.model, v.vehicleType].filter(Boolean).join(' · '),
        }))
        .filter((v) => v.id && v.id !== 'undefined');
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
    }
  },

  /**
   * Drivers matching `query` (name or phone), for the Reports driver picker.
   * @returns {Promise<Array<{ id: string, label: string, sub: string }>>}
   */
  searchDrivers: async (query, { signal, limit = 20 } = {}) => {
    try {
      const response = await apiClient.get('api/employees', {
        params: { role: 'DRIVER', limit, ...(query ? { search: query } : {}) },
        signal,
      });
      const list = Array.isArray(response.data?.data) ? response.data.data : [];
      return list
        .map((d) => ({
          id: String(d._id || d.id),
          label: `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Unknown',
          sub: d.mobileNumber || '',
        }))
        .filter((d) => d.id && d.id !== 'undefined');
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
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
      throw ApiError.from(error);
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
      throw ApiError.from(error);
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
      throw ApiError.from(error);
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
      throw ApiError.from(error);
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
      throw ApiError.from(error);
    }
  },

  /** GET /api/extension/fleetedge/status — multi-account connectivity info */
  getFleetEdgeConnectivity: async () => {
    try {
      const response = await apiClient.get('api/extension/fleetedge/status');
      return response.data?.data || response.data || { accounts: [], pull: {} };
    } catch (error) {
      logger.warn(
        'ReportsService',
        'API Error fetching FleetEdge connectivity',
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
      logger.warn(
        'ReportsService',
        'API Error fetching user errors',
        error.response?.data || error.message,
      );
      return [];
    }
  },

  /**
   * AdBlue telemetry comparison: logged top-ups against FleetEdge DEF use and tank level.
   * @param {object} params - { page, limit, startDate, endDate, search }
   * @returns {Promise<{ data?: Array, summary?: Object, meta?: Object, methodology?: Object }>} the response body
   */
  getAdBlueComparison: async (params = {}, { signal } = {}) => {
    try {
      const response = await apiClient.get('/api/adblue-logs/comparison', { params, signal });
      return response.data;
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /** POST /api/extension/fleetedge/process-tasks — on-demand pull + backfill */
  triggerPullNow: async () => {
    try {
      const response = await apiClient.post('api/extension/fleetedge/process-tasks');
      return response.data?.data || response.data || {};
    } catch (error) {
      throw ApiError.from(error);
    }
  },
};
