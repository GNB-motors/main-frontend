/**
 * Branch (operational location) API client.
 *
 * A "branch" is an operating office/depot within the business — the middle tier
 * of Organization → Branch → Vehicles. It is surfaced to users as a "Location"
 * (the header switcher). Distinct from the route-point `Location` feature
 * (utils/locationApi.js), which manages trip source/destination points.
 *
 * Uses the shared apiClient so every call inherits Authorization + X-Org-Id.
 */
import apiClient from '../utils/axiosConfig';

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const BranchService = {
  async listBranches(params = {}) {
    const res = await apiClient.get('/api/branches', { params });
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  async getBranch(id) {
    const res = await apiClient.get(`/api/branches/${id}`);
    return unwrap(res);
  },

  async createBranch(payload) {
    const res = await apiClient.post('/api/branches', payload);
    return unwrap(res);
  },

  async updateBranch(id, payload) {
    const res = await apiClient.patch(`/api/branches/${id}`, payload);
    return unwrap(res);
  },

  async deleteBranch(id) {
    const res = await apiClient.delete(`/api/branches/${id}`);
    return unwrap(res);
  },
};

export default BranchService;
