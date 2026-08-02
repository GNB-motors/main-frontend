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

  // Driver-vehicle assignments
  getAssignments: async (params = {}) => {
    const response = await apiClient.get('/api/driver-vehicle-assignments', { params });
    return unwrap(response);
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
};

export default KhataLedgerService;
