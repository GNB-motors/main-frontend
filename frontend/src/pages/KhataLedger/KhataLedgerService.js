import apiClient from '../../utils/axiosConfig';

const KhataLedgerService = {
  getExpenses: async (params = {}) => {
    const response = await apiClient.get('/api/expenses', { params });
    return response.data?.data || response.data;
  },

  getSummary: async (params = {}) => {
    const response = await apiClient.get('/api/expenses/summary', { params });
    return response.data?.data || response.data;
  },

  createExpense: async (data) => {
    const response = await apiClient.post('/api/expenses', data);
    return response.data?.data || response.data;
  },

  updateExpense: async (id, data) => {
    const response = await apiClient.put(`/api/expenses/${id}`, data);
    return response.data?.data || response.data;
  },

  deleteExpense: async (id) => {
    const response = await apiClient.delete(`/api/expenses/${id}`);
    return response.data;
  },
};

export default KhataLedgerService;
