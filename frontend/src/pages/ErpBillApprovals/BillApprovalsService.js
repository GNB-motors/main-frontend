/**
 * Driver Bill Approvals — API integration layer (web).
 *
 * Reuses the SAME backend endpoints the mobile app uses (`/api/app/v1/bills`) so
 * an owner/manager can approve a driver's bill from web OR app with identical
 * behaviour. A confirmed bill is credited to the driver's khata wallet; a
 * rejected bill stays out of it. Auth token + X-Org-Id are attached by axiosConfig.
 */
import apiClient from '../../utils/axiosConfig';

const BASE = '/api/app/v1/bills';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

// Bill endpoints wrap the body as { status, data }. Unwrap to the inner data.
const inner = (res) => res.data?.data ?? res.data;

const BillApprovalsService = {
  /** @param {Object} params - { status, page, limit, driverId } */
  list: async (params = {}) => {
    try {
      const res = await apiClient.get(BASE, { params });
      return inner(res);
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch bills');
    }
  },

  getById: async (id) => {
    try {
      const res = await apiClient.get(`${BASE}/${id}`);
      return inner(res);
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch bill');
    }
  },

  /** Owner/manager confirms → credits the driver's wallet. */
  confirm: async (id) => {
    try {
      const res = await apiClient.post(`${BASE}/${id}/confirm`);
      return inner(res);
    } catch (error) {
      throw unwrapError(error, 'Failed to confirm bill');
    }
  },

  /** Owner/manager rejects with a reason the driver sees. */
  reject: async (id, reason) => {
    try {
      const res = await apiClient.post(`${BASE}/${id}/reject`, { reason });
      return inner(res);
    } catch (error) {
      throw unwrapError(error, 'Failed to reject bill');
    }
  },
};

export default BillApprovalsService;
