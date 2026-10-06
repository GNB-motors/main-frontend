import apiClient from '../utils/axiosConfig';

const BASE = '/api/learning';
const unwrap = (response) => response.data?.data ?? response.data;

/**
 * Learning / Audit API (/api/learning). SUPER_ADMIN views any org's learning data
 * by passing `orgId`; owners/managers are scoped to their own org. Read-only here.
 * Each list returns { items, total, page, limit }.
 */
export const LearningService = {
  audit: async (params = {}, { signal } = {}) =>
    unwrap(await apiClient.get(`${BASE}/audit`, { params, signal })),

  promotionReports: async (params = {}, { signal } = {}) =>
    unwrap(await apiClient.get(`${BASE}/promotion-reports`, { params, signal })),

  driftReports: async (params = {}, { signal } = {}) =>
    unwrap(await apiClient.get(`${BASE}/drift-reports`, { params, signal })),
};

export default LearningService;
