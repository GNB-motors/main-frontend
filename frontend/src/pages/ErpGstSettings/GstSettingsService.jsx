/**
 * GST / e-Way Bill settings per location (branch). Sets the GSTIN + credentials
 * that switch on the inbound e-Way Bill pull for a location.
 */
import apiClient from '../../utils/axiosConfig';

const unwrap = (error, fallback) => new Error(error?.response?.data?.message || error?.message || fallback);

const GstSettingsService = {
  async listBranches() {
    try {
      const res = await apiClient.get('/api/branches');
      return res.data?.data || [];
    } catch (error) {
      throw unwrap(error, 'Failed to load locations');
    }
  },

  async getGst(branchId) {
    try {
      const res = await apiClient.get(`/api/branches/${branchId}/gst`);
      return res.data?.data;
    } catch (error) {
      throw unwrap(error, 'Failed to load GST settings');
    }
  },

  async updateGst(branchId, payload) {
    try {
      const res = await apiClient.patch(`/api/branches/${branchId}/gst`, payload);
      return res.data?.data;
    } catch (error) {
      throw unwrap(error, 'Failed to save GST settings');
    }
  },
};

export default GstSettingsService;
