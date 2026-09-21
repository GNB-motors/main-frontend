import apiClient from '../../../utils/axiosConfig';

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
      console.error('Error fetching WhatsApp reliability stats:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Could not fetch audit statistics.' };
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
      console.error('Error fetching WhatsApp audit requests:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Could not fetch audit requests.' };
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
      console.error('Error fetching request trace:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Could not fetch interaction trace.' };
    }
  },

  /**
   * Replay / re-queue an inbound message for re-processing.
   * @param {string} wamid Meta Provider Message ID
   */
  replayMessage: async (wamid) => {
    try {
      const response = await apiClient.post(`/api/whatsapp/admin/replay/${encodeURIComponent(wamid)}`);
      return response.data?.data || {};
    } catch (error) {
      console.error('Error replaying message:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Could not replay message.' };
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
};
