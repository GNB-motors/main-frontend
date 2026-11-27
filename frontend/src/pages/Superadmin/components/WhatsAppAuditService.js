import apiClient from '../../../utils/axiosConfig';
import ApiError from '../../../errors/ApiError';

/**
 * WhatsApp Reliability Audit Service
 * Interacts with /api/whatsapp/admin/audit/* endpoints (Guarded by SUPER_ADMIN).
 */
export const WhatsAppAuditService = {
  /**
   * Fetch aggregate reliability metrics, failure breakdown, and time-series.
   * @param {Object} params { startDate, endDate, orgId }
   */
  getStats: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/whatsapp/admin/audit/stats', { params });
      return response.data?.data || {};
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /**
   * Fetch paginated list of inbound requests with sender resolution & failure diagnosis.
   * @param {Object} params { status, stage, search, orgId, messageType, startDate, endDate, page, limit }
   */
  getRequests: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/whatsapp/admin/audit/requests', { params });
      return response.data?.data || { items: [], pagination: { total: 0, page: 1, totalPages: 1 } };
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /**
   * Fetch complete end-to-end trace for a specific inbound WhatsApp request.
   * @param {string} id Inbound ObjectId or WAMID
   */
  getRequestTrace: async (id) => {
    try {
      const response = await apiClient.get(`/api/whatsapp/admin/audit/requests/${id}`);
      return response.data?.data || null;
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /**
   * Replay / re-queue an inbound message for re-processing.
   * @param {string} wamid Meta Provider Message ID
   */
  replayMessage: async (wamid) => {
    try {
      const response = await apiClient.post(
        `/api/whatsapp/admin/replay/${encodeURIComponent(wamid)}`,
      );
      return response.data?.data || {};
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /**
   * Every WhatsApp group the listener phone is in, with the organization it
   * feeds, its last message and its counters (super-admin).
   * @returns {Promise<Array>}
   */
  getGroups: async () => {
    try {
      const response = await apiClient.get('/api/whatsapp/admin/groups');
      const body = response.data?.data ?? response.data;
      return Array.isArray(body) ? body : [];
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /**
   * Map a group to an organization. `null` unmaps it.
   * Only new messages follow the new organization.
   * @param {string} id Group id
   * @param {string|null} orgId Organization id
   */
  updateGroupOrg: async (id, orgId) => {
    try {
      const response = await apiClient.patch(
        `/api/whatsapp/admin/groups/${encodeURIComponent(id)}`,
        { orgId: orgId || null },
      );
      return response.data?.data ?? response.data ?? {};
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /**
   * Fetch list of organizations for filter dropdown.
   */
  getOrganizations: async () => {
    try {
      const response = await apiClient.get('/api/admin/organizations');
      return response.data?.data || response.data || [];
    } catch {
      return [];
    }
  },

  /**
   * The same list, but a failure is reported instead of being hidden behind an
   * empty list: a screen that offers no organization has to say why.
   */
  getOrganizationsStrict: async () => {
    try {
      const response = await apiClient.get('/api/admin/organizations');
      return response.data?.data || response.data || [];
    } catch (error) {
      throw ApiError.from(error);
    }
  },
};
