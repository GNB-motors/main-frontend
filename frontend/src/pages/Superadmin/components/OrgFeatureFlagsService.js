import apiClient from '../../../utils/axiosConfig';
import ApiError from '../../../errors/ApiError';

const call = async (request) => {
  try {
    return (await request).data?.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** Every organization (SUPER_ADMIN), [] when the body carries none. */
const listOrganizations = async ({ signal } = {}) =>
  (await call(apiClient.get('/api/admin/organizations', { signal }))) ?? [];

/** { flags, knownKeys } for one organization. */
const getOrgFlags = async (orgId, { signal } = {}) =>
  (await call(apiClient.get(`/api/feature-flags/${orgId}`, { signal }))) ?? {};

/** Registered (custom) flag definitions: [{ key, label, description }]. */
const getFlagRegistry = async ({ signal } = {}) =>
  (await call(apiClient.get('/api/feature-flags/registry', { signal }))) ?? [];

/** Patches only the changed keys; resolves to { flags } as saved. */
const updateOrgFlags = (orgId, features) =>
  call(apiClient.patch(`/api/feature-flags/${orgId}`, { features }));

const registerFlag = ({ key, label, description }) =>
  call(apiClient.post('/api/feature-flags/registry', { key, label, description }));

const removeRegisteredFlag = (key) =>
  call(apiClient.delete(`/api/feature-flags/registry/${encodeURIComponent(key)}`));

/** Removes the org's entities and keeps its historical records. */
const deleteOrganization = (orgId) => call(apiClient.delete(`/api/admin/organizations/${orgId}`));

/** Removes every record tied to the org. */
const purgeOrganization = (orgId) =>
  call(apiClient.delete(`/api/admin/organizations/${orgId}/purge`));

export const OrgFeatureFlagsService = {
  listOrganizations,
  getOrgFlags,
  getFlagRegistry,
  updateOrgFlags,
  registerFlag,
  removeRegisteredFlag,
  deleteOrganization,
  purgeOrganization,
};
