/* eslint-disable react-refresh/only-export-components */
import apiClient from '../../utils/axiosConfig';

// Talks to /api/permissions (SUPER_ADMIN-only catalog registry).
const BASE = '/api/permissions';

export const PermissionRegistryService = {
  // Full merged catalog tree (seed + dynamic); seed nodes carry `seed: true`.
  getCatalog: async () => {
    const res = await apiClient.get(`${BASE}/catalog`);
    return res.data?.data ?? [];
  },
  addEntry: async (body) => {
    const res = await apiClient.post(`${BASE}/registry`, body);
    return res.data?.data;
  },
  removeEntry: async (key) => {
    const res = await apiClient.delete(`${BASE}/registry/${encodeURIComponent(key)}`);
    return res.data;
  },
};

export default PermissionRegistryService;
