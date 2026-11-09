import {
  FRONTEND_FIELD_CATALOG,
  DATASETS,
  PROPOSED_UNSUPPORTED_FIELDS,
  REPORT_TEMPLATES,
} from './reports/custom/customReportFields';
import { getStorageItem, setStorageItem } from '../../utils/session';
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
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
    }
  },

  getFuelCycles: (params = {}, signal) =>
    ReportsService._getTripReport('api/reports/fuel-cycles', params, signal),
  /**
   * One fuel cycle's trips and fuel slips (drop-down under a Fuel Cycles row).
   * @returns {Promise<{ cycle: Object, summary: Object|null, trips: Array, slips: Array }>}
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
        slips: Array.isArray(data.slips) ? data.slips : [],
      };
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
    }
  },
  /**
   * The "Full tank" report tab (GET /api/reports/fuel-cycles/full-tank-tab).
   *
   * This endpoint is newer than the rest of the Reports API, so a backend
   * that has not shipped it yet answers 404. That is not a failure of the
   * request but an answer about the server, so it is reported as
   * `available: false` instead of being thrown: the caller hides the tab
   * rather than showing a broken report. Every other failure still throws a
   * typed ApiError, and the response body is returned under `data` with the
   * endpoint's own field names (trucks, summary, models, days).
   * @param {object} params - { days, search }
   * @param {AbortSignal} signal
   * @returns {Promise<{ available: boolean, data: Object|null }>}
   */
  getFullTankTab: async (params = {}, signal) => {
    try {
      const response = await apiClient.get('api/reports/fuel-cycles/full-tank-tab', {
        params,
        signal,
      });
      const body = response.data?.data ?? response.data ?? {};
      return { available: true, data: body };
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      const apiError = ApiError.from(error);
      if (apiError.status === 404) return { available: false, data: null };
      throw apiError;
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
      if (error?.name === 'CanceledError') throw error;
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
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
    }
  },

  /**
   * Vehicles matching `query` (registration or chassis), for the Reports
   * vehicle picker. Server-searched, so a fleet of any size is reachable.
   * @returns {Promise<Array<{ id: string, label: string, sub: string }>>}
   */
  searchVehicles: async (query, { signal, limit = 20, manufacturer } = {}) => {
    try {
      const response = await apiClient.get('api/vehicles', {
        params: {
          limit,
          ...(manufacturer ? { manufacturer } : {}),
          ...(query ? { search: query } : {}),
        },
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
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
    }
  },

  // ─── Extension API ───────────────────────────────────────────────────────

  /**
   * Fetches the current fuel comparison sync status.
   * @returns {Promise<Object>} - { pending, inProgress, completed, failed, flagged, total, lastSyncAt, isUpToDate }
   */
  getExtensionStatus: async (params = {}) => {
    try {
      const response = await apiClient.get(`api/extension/status`, { params });
      return response.data?.data || response.data || {};
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
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
      if (error?.name === 'CanceledError') throw error;
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
      if (error?.name === 'CanceledError') throw error;
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
      if (error?.name === 'CanceledError') throw error;
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
      if (error?.name === 'CanceledError') throw error;
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
  getAdBlueComparison: async (params = {}, signalOrOptions = {}) => {
    const signal =
      signalOrOptions instanceof AbortSignal ? signalOrOptions : signalOrOptions?.signal;
    try {
      const response = await apiClient.get('/api/adblue-logs/comparison', { params, signal });
      return response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
    }
  },

  /** POST /api/extension/fleetedge/process-tasks — on-demand pull + backfill */
  triggerPullNow: async () => {
    try {
      const response = await apiClient.post('api/extension/fleetedge/process-tasks');
      return response.data?.data || response.data || {};
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
    }
  },
  // --- Custom Reports ---
  getCustomReportCatalog: async (signal) => {
    try {
      const response = await apiClient.get('/api/reports/custom/fields', { signal });
      if (response.data?.data) return response.data.data;
      if (response.data?.fields) return response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
    }
    return {
      datasets: DATASETS,
      fields: FRONTEND_FIELD_CATALOG,
      unsupportedFields: PROPOSED_UNSUPPORTED_FIELDS,
    };
  },

  getCustomReportTemplates: async (signal) => {
    try {
      const response = await apiClient.get('/api/reports/custom/templates', { signal });
      if (Array.isArray(response.data?.data)) return response.data.data;
      if (Array.isArray(response.data)) return response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
    }
    return REPORT_TEMPLATES;
  },

  executeCustomReport: async (config, signal) => {
    try {
      const response = await apiClient.post('/api/reports/custom/query', config, { signal });
      return response.data;
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error;
      throw ApiError.from(error);
    }
  },

  getSavedCustomReports: async (signal) => {
    try {
      const response = await apiClient.get('/api/reports/custom/saved', { signal });
      if (Array.isArray(response.data?.data)) return response.data.data;
      if (Array.isArray(response.data)) return response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
    }
    return getLocalSavedReports();
  },

  getSavedCustomReportById: async (id, signal) => {
    try {
      const response = await apiClient.get(`/api/reports/custom/saved/${id}`, { signal });
      if (response.data?.data) return response.data.data;
      if (response.data?.name) return response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
    }
    const saved = getLocalSavedReports();
    return saved.find((r) => (r._id || r.id) === id) || null;
  },

  createSavedCustomReport: async (data) => {
    try {
      const response = await apiClient.post('/api/reports/custom/saved', data);
      return response.data?.data || response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      const list = getLocalSavedReports();
      const newReport = {
        ...data,
        _id: 'saved-' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      list.unshift(newReport);
      setLocalSavedReports(list);
      return newReport;
    }
  },

  updateSavedCustomReport: async (id, data) => {
    try {
      const response = await apiClient.put(`/api/reports/custom/saved/${id}`, data);
      return response.data?.data || response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      const list = getLocalSavedReports();
      const idx = list.findIndex((r) => (r._id || r.id) === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
        setLocalSavedReports(list);
        return list[idx];
      }
      return data;
    }
  },

  deleteSavedCustomReport: async (id) => {
    try {
      const response = await apiClient.delete(`/api/reports/custom/saved/${id}`);
      return response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      const list = getLocalSavedReports().filter((r) => (r._id || r.id) !== id);
      setLocalSavedReports(list);
      return { status: 'success' };
    }
  },

  createFieldRequest: async (data) => {
    try {
      const response = await apiClient.post('/api/reports/custom/field-requests', data);
      return response.data?.data || response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      const list = getLocalFieldRequests();
      const newReq = {
        ...data,
        _id: 'req-' + Date.now(),
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
        requestedBy: { firstName: 'Fleet', lastName: 'Member' },
      };
      list.unshift(newReq);
      setLocalFieldRequests(list);
      return newReq;
    }
  },

  getFieldRequests: async (signal) => {
    try {
      const response = await apiClient.get('/api/reports/custom/field-requests', { signal });
      if (Array.isArray(response.data?.data)) return response.data.data;
      if (Array.isArray(response.data)) return response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
    }
    return getLocalFieldRequests();
  },

  updateFieldRequestStatus: async (id, data) => {
    try {
      const response = await apiClient.patch(`/api/reports/custom/field-requests/${id}`, data);
      return response.data?.data || response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      const list = getLocalFieldRequests();
      const idx = list.findIndex((r) => (r._id || r.id) === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
        setLocalFieldRequests(list);
        return list[idx];
      }
      return data;
    }
  },
};

const LOCAL_SAVED_KEY = 'gnb_saved_custom_reports';
const getLocalSavedReports = () => {
  try {
    return JSON.parse(getStorageItem(LOCAL_SAVED_KEY) || '[]');
  } catch {
    return [];
  }
};
const setLocalSavedReports = (list) => {
  try {
    setStorageItem(LOCAL_SAVED_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
};

const LOCAL_REQUESTS_KEY = 'gnb_custom_field_requests';
const getLocalFieldRequests = () => {
  try {
    const stored = JSON.parse(getStorageItem(LOCAL_REQUESTS_KEY) || '[]');
    if (stored && stored.length) return stored;
  } catch {
    // ignore
  }
  return [
    {
      _id: 'req-sample-1',
      fieldName: 'GPS Over-Speed Violations',
      module: 'TRIP',
      description: 'Count of over-speeding instances exceeding route thresholds.',
      reason: 'Driver safety scoring and insurance risk reduction.',
      status: 'UNDER_REVIEW',
      adminComments: 'Evaluating Valhalla map matching integration.',
      createdAt: new Date().toISOString(),
      requestedBy: { firstName: 'Fleet', lastName: 'Manager' },
    },
    {
      _id: 'req-sample-2',
      fieldName: 'FASTag Plaza Deductions',
      module: 'FUEL',
      description: 'Toll plaza name, timestamp, and amount deducted.',
      reason: 'Reconcile toll expenses against trip routes.',
      status: 'APPROVED',
      adminComments: 'Scheduled for next sprint API integration.',
      createdAt: new Date().toISOString(),
      requestedBy: { firstName: 'Operations', lastName: 'Team' },
    },
  ];
};
const setLocalFieldRequests = (list) => {
  try {
    setStorageItem(LOCAL_REQUESTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
};
