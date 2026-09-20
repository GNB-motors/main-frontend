import axios from 'axios';
import apiClient from '../utils/axiosConfig';

/**
 * Reusable "document-style" share links.
 *
 * A share link is an unguessable token scoped to ONE backend resource. Anyone
 * with the link can view only that resource, with no login, until it expires or
 * is revoked. This service is intentionally resource-agnostic so any feature
 * (a vehicle's live location today; a trip, a report, a POD tomorrow) can mint
 * links by passing its own `resourceType` + `resource` pointer.
 *
 * Authed calls (create/list/revoke) go through the normal `apiClient`.
 * Public reads go through a bare, token-less axios instance so an anonymous
 * viewer and a logged-in operator hit the same endpoint identically.
 */
const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 20000,
});

export const ShareService = {
  /**
   * Create (or reuse) a share link for one resource.
   * @param {{ resourceType: string, resource: object, label?: string, ttlDays?: number }} params
   * @returns {Promise<{ token, url, resourceType, resource, label, expiresAt }>}
   */
  createShareLink: async ({ resourceType, resource, label, ttlDays }) => {
    const { data } = await apiClient.post('/api/share', {
      resourceType,
      resource,
      label,
      ttlDays,
    });
    return data?.data || {};
  },

  /** List the caller org's share links, optionally filtered by resource. */
  listShareLinks: async (params = {}) => {
    const { data } = await apiClient.get('/api/share', { params });
    return data?.data?.records || [];
  },

  /** Revoke a share link by token. */
  revokeShareLink: async (token) => {
    const { data } = await apiClient.delete(`/api/share/${encodeURIComponent(token)}`);
    return data?.data || {};
  },

  /** PUBLIC: resolve a token to its single resource's projection (no auth). */
  getPublicShare: async (token, { signal } = {}) => {
    const { data } = await publicClient.get(`/api/public/share/${encodeURIComponent(token)}`, {
      signal,
    });
    return data?.data || {};
  },

  /** PUBLIC: recent trail for a vehicle_location share (no auth). */
  getPublicShareTrail: async (token, { hours, signal } = {}) => {
    const { data } = await publicClient.get(
      `/api/public/share/${encodeURIComponent(token)}/trail`,
      { params: hours ? { hours } : {}, signal },
    );
    return data?.data || {};
  },
};

export default ShareService;
