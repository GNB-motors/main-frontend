import apiClient from '../../utils/axiosConfig';

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

  getExpenseById: async (id) => {
    const response = await apiClient.get(`/api/expenses/${id}`);
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

  // Driver-vehicle assignments.
  // This endpoint answers { status, data: [...], meta: {...} } — `meta` is a
  // sibling of `data`, so the shared unwrap() drops it. Read both off the raw
  // response, otherwise pagination is unreachable.
  getAssignments: async (params = {}) => {
    const response = await apiClient.get('/api/driver-vehicle-assignments', { params });
    const body = response.data || {};
    return {
      results: Array.isArray(body.data) ? body.data : [],
      meta: body.meta || { page: 1, totalPages: 1, total: 0 },
    };
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

  getActiveAssignment: async ({ driverId, vehicleId } = {}) => {
    const params = { activeOn: new Date().toISOString() };
    if (driverId) params.driverId = driverId;
    if (vehicleId) params.vehicleId = vehicleId;
    const response = await apiClient.get('/api/driver-vehicle-assignments', { params });
    const list = Array.isArray(response.data?.data) ? response.data.data : [];
    return list.length ? list[0] : null;
  },
};

export default KhataLedgerService;
