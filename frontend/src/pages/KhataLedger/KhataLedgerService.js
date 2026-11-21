import apiClient from '../../utils/axiosConfig';
import DriverVehicleAssignmentService from '../../services/DriverVehicleAssignmentService';
import { getBranchId } from '../../utils/session.js';

const unwrap = (res) => res.data?.data || res.data;

// The ERP module answers 404 for organisations that have not switched ERP on.
// That is a different situation from "no trips yet", so it gets its own message.
export const ERP_DISABLED_MESSAGE = "ERP isn't switched on for your organisation";

export const isErpDisabledError = (err) => (err?.status ?? err?.response?.status) === 404;

const erpDisabledError = () => {
  const err = new Error(ERP_DISABLED_MESSAGE);
  err.name = 'ErpDisabledError';
  err.status = 404;
  err.erpDisabled = true;
  return err;
};

// Whether the active location has any ERP trip at all. The ERP pieces of Khata
// (the ERP trips tab, trip revenue and profit, the trip report) stay hidden until
// it does: an organisation without ERP answers 404, one that has not planned a
// trip yet answers an empty list. Asked once per location for a few minutes.
const ERP_CHECK_TTL_MS = 5 * 60 * 1000;
const erpChecks = new Map();

const hasErpTrips = async () => {
  try {
    const response = await apiClient.get('/api/erp/trips', { params: { page: 1, limit: 1 } });
    const rows = response.data?.data;
    const total = Number(response.data?.meta?.total);
    return Number.isFinite(total) ? total > 0 : Array.isArray(rows) && rows.length > 0;
  } catch (err) {
    if (isErpDisabledError(err)) return false;
    // Unknown is not "no": leave the ERP pieces in place and let them show their own error.
    return true;
  }
};

export const getErpAvailability = () => {
  const key = getBranchId() || 'all';
  const cached = erpChecks.get(key);
  if (cached && Date.now() - cached.at < ERP_CHECK_TTL_MS) return cached.promise;
  const promise = hasErpTrips();
  erpChecks.set(key, { at: Date.now(), promise });
  return promise;
};

export const resetErpAvailability = () => erpChecks.clear();

// Chart aggregates need the complete filtered set; the API caps each page at 100.
const getDashboardPages = async (path, params, { signal } = {}) => {
  const all = [];
  for (let page = 1, totalPages = 1; page <= totalPages; page += 1) {
    const response = await apiClient.get(path, { params: { ...params, page, limit: 100 }, signal });
    const payload = unwrap(response);
    const rows = Array.isArray(payload) ? payload : payload?.results || payload?.data;
    if (!Array.isArray(rows)) throw new Error('Could not read dashboard records');
    const meta = Array.isArray(payload) ? response.data?.meta : payload?.meta || payload;
    totalPages = Math.max(1, Number(meta?.totalPages) || 1);
    if (!rows.length && page < totalPages) throw new Error('Dashboard records are incomplete');
    all.push(...rows);
  }
  return all;
};

const KhataLedgerService = {
  getDashboardExpenses: (params, options) => getDashboardPages('/api/expenses', params, options),
  getDashboardTrips: async (params, options) => {
    try {
      return await getDashboardPages('/api/erp/trips', params, options);
    } catch (err) {
      if (isErpDisabledError(err)) throw erpDisabledError();
      throw err;
    }
  },
  // Existing /api/expenses endpoints (All Transactions tab)
  getExpenses: async (params = {}) => {
    const response = await apiClient.get('/api/expenses', { params });
    return unwrap(response);
  },

  getSummary: async (params = {}) => {
    const response = await apiClient.get('/api/expenses/summary', { params });
    return unwrap(response);
  },

  createExpense: async (data) => {
    const response = await apiClient.post('/api/expenses', data);
    return unwrap(response);
  },

  updateExpense: async (id, data) => {
    const response = await apiClient.put(`/api/expenses/${id}`, data);
    return unwrap(response);
  },

  deleteExpense: async (id) => {
    const response = await apiClient.delete(`/api/expenses/${id}`);
    return response.data;
  },

  // Driver-centric khata endpoints
  getDrivers: async (params = {}) => {
    const response = await apiClient.get('/api/khata/drivers', { params });
    return unwrap(response);
  },

  getDriverLedger: async (id, params = {}) => {
    const response = await apiClient.get(`/api/khata/drivers/${id}/ledger`, { params });
    return unwrap(response);
  },

  getDriverSummary: async (id, params = {}) => {
    const response = await apiClient.get(`/api/khata/drivers/${id}/summary`, { params });
    return unwrap(response);
  },

  // Vehicle-centric khata endpoints
  getVehicles: async (params = {}) => {
    const response = await apiClient.get('/api/khata/vehicles', { params });
    return unwrap(response);
  },

  getVehicleLedger: async (id, params = {}) => {
    const response = await apiClient.get(`/api/khata/vehicles/${id}/ledger`, { params });
    return unwrap(response);
  },

  getVehicleSummary: async (id, params = {}) => {
    const response = await apiClient.get(`/api/khata/vehicles/${id}/summary`, { params });
    return unwrap(response);
  },

  // Driver-vehicle assignments — implementation lives in the shared
  // DriverVehicleAssignmentService (also used by the Employee page); kept
  // re-exported here so existing Khata Ledger call sites are unaffected.
  getAssignments: DriverVehicleAssignmentService.getAssignments,
  getAssignmentPage: DriverVehicleAssignmentService.getAssignmentPage,
  createAssignment: DriverVehicleAssignmentService.createAssignment,
  updateAssignment: DriverVehicleAssignmentService.updateAssignment,
  endAssignment: DriverVehicleAssignmentService.endAssignment,
  deleteAssignment: DriverVehicleAssignmentService.deleteAssignment,
  getActiveAssignment: DriverVehicleAssignmentService.getActiveAssignment,

  // ERP Trip integration endpoints
  getErpTrips: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/erp/trips', { params });
      return response.data || { data: [], meta: { total: 0 } };
    } catch (err) {
      if (isErpDisabledError(err)) throw erpDisabledError();
      throw err;
    }
  },

  getErpTripById: async (id) => {
    const response = await apiClient.get(`/api/erp/trips/${id}`);
    return unwrap(response);
  },

  getErpTripFinance: async (id, { signal } = {}) => {
    try {
      const response = await apiClient.get(`/api/erp/trips/${id}/finance`, { signal });
      return unwrap(response);
    } catch (err) {
      if (err?.response?.status === 404 || err?.response?.status === 403) return null;
      throw err;
    }
  },

  getTripExpenses: async (tripId, params = {}) => {
    const response = await apiClient.get('/api/expenses', {
      params: { ...params, tripId, includeTripExpenses: true, limit: 100 },
    });
    return unwrap(response);
  },

  getDriverTrips: async (driverId, params = {}) => {
    try {
      const response = await apiClient.get('/api/erp/trips', {
        params: { ...params, driverId, limit: params.limit || 50 },
      });
      return response.data?.data || response.data?.results || response.data || [];
    } catch {
      return [];
    }
  },

  getVehicleTrips: async (vehicleId, params = {}) => {
    try {
      const response = await apiClient.get('/api/erp/trips', {
        params: { ...params, vehicleId, limit: params.limit || 50 },
      });
      return response.data?.data || response.data?.results || response.data || [];
    } catch {
      return [];
    }
  },
};

export default KhataLedgerService;
