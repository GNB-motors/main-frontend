import apiClient from '../../utils/axiosConfig';

const unwrap = (res) => res.data?.data;
const asArray = (res) => {
  const d = res.data?.data ?? res.data;
  return Array.isArray(d) ? d : [];
};

/**
 * Enterprise Employee Access Control API — available roles, employee role
 * assignments, and per-branch role configuration. Backed by /api/access-control/*.
 * Reuses the shared apiClient (auth + X-Org-Id + X-Branch-Id headers).
 */
const AccessControlApi = {
  // Enterprise roles + permission catalog
  getRolesAndCatalog: () => apiClient.get('/api/access-control/roles').then(unwrap),

  // Enterprise-owned custom roles (platform roles are read-only here)
  createRole: (body) => apiClient.post('/api/access-control/roles', body).then(unwrap),
  updateRole: (roleId, body) => apiClient.patch(`/api/access-control/roles/${roleId}`, body).then(unwrap),
  deleteRole: (roleId) => apiClient.delete(`/api/access-control/roles/${roleId}`).then(unwrap),

  // Assignments
  listAssignments: (userId) =>
    apiClient.get('/api/access-control/assignments', { params: userId ? { userId } : {} }).then(unwrap),
  assignRole: (body) => apiClient.post('/api/access-control/assignments', body).then(unwrap),
  revokeAssignment: (id) => apiClient.delete(`/api/access-control/assignments/${id}`).then(unwrap),

  // Branch access
  getBranchRoles: (branchId) => apiClient.get(`/api/access-control/branches/${branchId}/roles`).then(unwrap),
  // Create a custom role scoped to a single branch.
  createBranchRole: (branchId, body) =>
    apiClient.post(`/api/access-control/branches/${branchId}/roles`, body).then(unwrap),
  setBranchRole: (branchId, roleId, body) =>
    apiClient.patch(`/api/access-control/branches/${branchId}/roles/${roleId}`, body).then(unwrap),
  resetBranchRole: (branchId, roleId) =>
    apiClient.delete(`/api/access-control/branches/${branchId}/roles/${roleId}`).then(unwrap),

  // Shared lookups. /api/employees paginates with a default of 10 — the role
  // picker needs the whole team, so ask for the server's maximum page size.
  listEmployees: () => apiClient.get('/api/employees', { params: { limit: 1000 } }).then(asArray),
  listBranches: () => apiClient.get('/api/branches').then(asArray),
};

export default AccessControlApi;
