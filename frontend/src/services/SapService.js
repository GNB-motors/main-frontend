import apiClient from '../utils/axiosConfig';
import { parseSafe } from '../schemas/validate';

/**
 * SAP on routes (/api/sap, behind the org's `sapV2` flag, OWNER/MANAGER). A route is a pickup
 * place → drop place run; its SAP is set by a person, or proposed by a sheet import that a
 * person confirms.
 */
const BASE = '/api/sap';
const unwrap = (r) => r.data?.data ?? r.data;
const schemas = () => import('../schemas/sap.schema');
const parsed = (name, response) => parseSafe(name, schemas, unwrap(response));
export const SapService = {
  trip: async (id, { signal } = {}) =>
    parsed('sapTripDetailSchema', await apiClient.get(`${BASE}/trips/${id}`, { signal })),
  routes: async (params = {}, { signal } = {}) =>
    parsed('sapRouteListSchema', await apiClient.get(`${BASE}/routes`, { params, signal })),
  /** { fromSiteId, toSiteId, sapKm, basis, note } — supersedes the route's current SAP. */
  setRoute: async (body, { signal } = {}) =>
    parsed('sapRouteEntrySchema', await apiClient.put(`${BASE}/routes`, body, { signal })),
  removeRoute: async (id, { signal } = {}) =>
    parsed('sapDeleteSchema', await apiClient.delete(`${BASE}/routes/${id}`, { signal })),
  hint: async (params, { signal } = {}) =>
    parsed('sapHintSchema', await apiClient.get(`${BASE}/routes/hint`, { params, signal })),
  settings: async ({ signal } = {}) =>
    parsed('sapSettingsSchema', await apiClient.get(`${BASE}/settings`, { signal })),
  saveSettings: async (body, { signal } = {}) =>
    parsed('sapSettingsSchema', await apiClient.put(`${BASE}/settings`, body, { signal })),
  /** { csv } or { fromStoredSheet: true } — proposals only, nothing is written. */
  importPreview: async (body, { signal } = {}) =>
    parsed(
      'sapImportPreviewSchema',
      await apiClient.post(`${BASE}/import/preview`, body, { signal }),
    ),
  importApply: async (body, { signal } = {}) =>
    parsed('sapImportApplySchema', await apiClient.post(`${BASE}/import/apply`, body, { signal })),
};
export default SapService;
