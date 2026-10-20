/**
 * Inbound e-Way Bill (ISOCL ERP Stage 5) - API Integration Layer
 *
 * Waybills arrive from the GST network (or are staged by the demo script) and
 * sit here until an operator confirms one against a trip. Confirming is what
 * creates the consignment note - the CN is never typed in by hand.
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/inbound-ewb';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const InboundEwbService = {
  /** Review queue. Omitting status returns SUGGESTED + UNMATCHED. */
  getQueue: async ({ status } = {}) => {
    try {
      const response = await apiClient.get(BASE, {
        params: { ...(status ? { status } : {}) },
      });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to load inbound e-Way Bills');
    }
  },

  /**
   * Approve one waybill onto its trip. Overrides are optional - anything left
   * out is filled from the e-Way Bill itself.
   */
  confirm: async (ewbId, overrides = {}) => {
    try {
      const response = await apiClient.post(`${BASE}/${ewbId}/confirm`, overrides);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to confirm the e-Way Bill');
    }
  },

  ignore: async (ewbId) => {
    try {
      const response = await apiClient.post(`${BASE}/${ewbId}/ignore`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to ignore the e-Way Bill');
    }
  },

  /** On-demand pull from the GST network, then re-run the matcher. */
  sync: async () => {
    try {
      const response = await apiClient.post(`${BASE}/sync`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to sync from the GST network');
    }
  },
};

export default InboundEwbService;
