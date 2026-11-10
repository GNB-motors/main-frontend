/**
 * Driver ↔ Vehicle assignment API client.
 *
 * Backs the "primary driver for a vehicle" concept (backend model
 * `DriverVehicleAssignment`) — a separate ledger, not a field on the
 * Employee or Vehicle collections. Used from the Employee page (assign a
 * vehicle to a driver), Khata Ledger's Assignments tab, and anywhere else
 * that needs to suggest "who's currently driving this vehicle".
 *
 * Uses the shared apiClient so every call inherits Authorization + X-Org-Id
 * (+ X-Branch-Id when a branch is active).
 */
import apiClient from '../utils/axiosConfig';
import { parseSafe } from '../schemas/validate.js';

const unwrap = (res) => res.data?.data || res.data;

/** The list endpoint populates driverId/vehicleId — normalize back to a bare id. */
const idOf = (refOrId) => (refOrId && typeof refOrId === 'object' ? refOrId._id : refOrId) || '';

/** The person columns the bulk endpoints take, plus the vehicle. */
const BULK_ROW_KEYS = ['name', 'phone', 'licence', 'aadhaar', 'vehicle'];

/**
 * One row of a bulk request: every person column the sheet had, the vehicle,
 * the spreadsheet row, and the driver the manager picked (when there is one).
 */
const bulkRow = (row = {}) => {
  const out = { rowNumber: Number(row.rowNumber) || 0 };
  BULK_ROW_KEYS.forEach((key) => {
    out[key] = String(row[key] ?? '').trim();
  });
  if (row.userId) out.userId = String(row.userId).trim();
  return out;
};

/** The body the bulk preview and apply endpoints want. */
const bulkBody = (payload = {}) => ({
  rows: (Array.isArray(payload.rows) ? payload.rows : []).map(bulkRow),
  effectiveAt: payload.effectiveAt,
  fileName: payload.fileName,
});

/**
 * The report the server sends back: every row with a code and, when the server
 * is unsure about a driver, the drivers it is unsure between.
 */
const bulkReport = (data) => {
  if (!data || typeof data !== 'object') return data;
  return {
    ...data,
    rows: (Array.isArray(data.rows) ? data.rows : []).map((row) => ({
      ...row,
      code: row.code || row.errorCode || '',
      candidates: Array.isArray(row.candidates) ? row.candidates : [],
    })),
  };
};

const DriverVehicleAssignmentService = {
  previewBulk: async (payload) => {
    const response = await apiClient.post(
      '/api/driver-vehicle-assignments/bulk/preview',
      bulkBody(payload),
      {
        timeout: 200000,
      },
    );
    return bulkReport(response.data.data);
  },
  applyBulk: async (payload) => {
    const response = await apiClient.post('/api/driver-vehicle-assignments/bulk/apply', bulkBody(payload), {
      timeout: 200000,
    });
    return bulkReport(response.data.data);
  },
  getAssignmentPage: async (params = {}, { signal } = {}) => {
    const response = await apiClient.get('/api/driver-vehicle-assignments', { params, signal });
    const results = await parseSafe(
      'driverVehicleAssignmentListSchema',
      () => import('../schemas/driverVehicleAssignment.schema.js'),
      unwrap(response),
    );
    return {
      results,
      meta: response.data?.meta || { page: 1, totalPages: 1, total: results.length },
    };
  },

  getAssignments: async (params = {}, { signal } = {}) => {
    const response = await apiClient.get('/api/driver-vehicle-assignments', { params, signal });
    return parseSafe(
      'driverVehicleAssignmentListSchema',
      () => import('../schemas/driverVehicleAssignment.schema.js'),
      unwrap(response),
    );
  },

  createAssignment: async (data) => {
    const response = await apiClient.post('/api/driver-vehicle-assignments', data);
    return unwrap(response);
  },

  updateAssignment: async (id, data) => {
    const response = await apiClient.put(`/api/driver-vehicle-assignments/${id}`, data);
    return unwrap(response);
  },

  endAssignment: async (id) => {
    const response = await apiClient.post(`/api/driver-vehicle-assignments/${id}/end`);
    return unwrap(response);
  },

  deleteAssignment: async (id) => {
    const response = await apiClient.delete(`/api/driver-vehicle-assignments/${id}`);
    return response.data;
  },

  /**
   * The single active assignment for a driver or vehicle as of `activeOn`
   * (defaults to now). Returns null if none (or more than one — ambiguous
   * periods resolve to "no suggestion" rather than guessing).
   */
  getActiveAssignment: async ({ driverId, vehicleId, activeOn } = {}, { signal } = {}) => {
    const params = {
      activeOn: activeOn ? new Date(activeOn).toISOString() : new Date().toISOString(),
    };
    if (driverId) params.driverId = driverId;
    if (vehicleId) params.vehicleId = vehicleId;
    const response = await apiClient.get('/api/driver-vehicle-assignments', { params, signal });
    const data = unwrap(response);
    const list = data?.results || data?.items || data || [];
    return Array.isArray(list) && list.length ? list[0] : null;
  },

  /** Every assignment active right now, across all pages (backend caps limit at 200). */
  getAllActiveAssignments: async ({ signal } = {}) => {
    const params = { activeOn: new Date().toISOString(), limit: 200 };
    const all = [];
    for (let page = 1, totalPages = 1; page <= totalPages; page += 1) {
      const response = await apiClient.get('/api/driver-vehicle-assignments', {
        params: { ...params, page },
        signal,
      });
      totalPages = response.data?.meta?.totalPages || 1;
      all.push(
        ...(await parseSafe(
          'driverVehicleAssignmentListSchema',
          () => import('../schemas/driverVehicleAssignment.schema.js'),
          unwrap(response),
        )),
      );
    }
    return all;
  },

  idOf,
};

export default DriverVehicleAssignmentService;
