/**
 * Inbound e-Way Bill review — API client.
 * Backend: /api/erp/inbound-ewb (GST auto-fill: EWBs pulled from the network,
 * auto-matched to open trips). See gst_sandbox_integration_plan.md.
 */
import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/inbound-ewb';

const unwrap = (error, fallback) => {
  const msg = error?.response?.data?.message || error?.message || fallback;
  return new Error(msg);
};

const InboundEwbService = {
  async list(params = {}) {
    try {
      const res = await apiClient.get(BASE, { params });
      return res.data?.data || [];
    } catch (error) {
      throw unwrap(error, 'Failed to load inbound e-Way Bills');
    }
  },

  async confirm(id, overrides = {}) {
    try {
      const res = await apiClient.post(`${BASE}/${id}/confirm`, overrides);
      return res.data?.data;
    } catch (error) {
      throw unwrap(error, 'Failed to confirm e-Way Bill');
    }
  },

  async ignore(id) {
    try {
      const res = await apiClient.post(`${BASE}/${id}/ignore`);
      return res.data?.data;
    } catch (error) {
      throw unwrap(error, 'Failed to ignore e-Way Bill');
    }
  },
};

export default InboundEwbService;
