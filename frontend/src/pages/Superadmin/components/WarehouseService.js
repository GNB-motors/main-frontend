import apiClient from '../../../utils/axiosConfig';
import ApiError from '../../../errors/ApiError';

/**
 * Service functions for the ClickHouse warehouse observability page.
 * All endpoints live under /api/warehouse and are guarded by SUPER_ADMIN.
 */
export const WarehouseService = {
  /**
   * Latest reconciliation status per warehouse table.
   */
  getStatus: async () => {
    try {
      const response = await apiClient.get('/api/warehouse/status');
      return response.data || {};
    } catch (error) {
      throw ApiError.from(error);
    }
  },
};
