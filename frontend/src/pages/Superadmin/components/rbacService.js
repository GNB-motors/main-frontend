import apiClient from '../../../utils/axiosConfig';

// All responses are shaped { status, data }. Unwrap to the payload.
const unwrap = (res) => res.data?.data;

/**
 * SuperAdmin RBAC API — global permission catalog, global role definitions, and
 * per-enterprise role availability. Backed by /api/rbac/* (SUPER_ADMIN only) and
 * /api/admin/organizations for the enterprise picker.
 */
const RbacApi = {
  // Permissions
  listPermissions: () => apiClient.get('/api/rbac/permissions').then(unwrap),
  seedPermissions: () => apiClient.post('/api/rbac/permissions/seed').then(unwrap),
  createPermission: (body) => apiClient.post('/api/rbac/permissions', body).then(unwrap),
  updatePermission: (id, body) => apiClient.patch(`/api/rbac/permissions/${id}`, body).then(unwrap),
  deletePermission: (id) => apiClient.delete(`/api/rbac/permissions/${id}`).then(unwrap),

  // Global roles
  listRoles: () => apiClient.get('/api/rbac/roles').then(unwrap),
  getRole: (id) => apiClient.get(`/api/rbac/roles/${id}`).then(unwrap),
  createRole: (body) => apiClient.post('/api/rbac/roles', body).then(unwrap),
  updateRole: (id, body) => apiClient.patch(`/api/rbac/roles/${id}`, body).then(unwrap),
  deleteRole: (id) => apiClient.delete(`/api/rbac/roles/${id}`).then(unwrap),

  // Per-enterprise role availability
  listEnterpriseRoles: (orgId) => apiClient.get(`/api/rbac/enterprises/${orgId}/roles`).then(unwrap),
  bulkSetEnterpriseRoles: (orgId, roles) =>
    apiClient.put(`/api/rbac/enterprises/${orgId}/roles`, { roles }).then(unwrap),

  // Enterprise picker
  listOrganizations: () => apiClient.get('/api/admin/organizations').then(unwrap),
};

export default RbacApi;
