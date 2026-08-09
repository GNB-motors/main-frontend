import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/dashboard';

const ErpDashboardService = {
  getSummary: async () => {
    const response = await apiClient.get(`${BASE}/summary`);
    return response.data;
  },
};

export default ErpDashboardService;
