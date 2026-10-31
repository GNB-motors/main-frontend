import apiClient from '../../utils/axiosConfig';
import DriverVehicleAssignmentService from '../../services/DriverVehicleAssignmentService';

const unwrap = (res) => res.data?.data || res.data;

const KhataLedgerService = {
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
      if (err?.response?.status === 404) return { data: [], meta: { total: 0 } };
      throw err;
    }
  },

  getErpTripById: async (id) => {
    const response = await apiClient.get(`/api/erp/trips/${id}`);
    return unwrap(response);
  },

  getErpTripFinance: async (id) => {
    try {
      const response = await apiClient.get(`/api/erp/trips/${id}/finance`);
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
