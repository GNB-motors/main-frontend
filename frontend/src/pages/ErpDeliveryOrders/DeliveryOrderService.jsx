/**
 * Delivery Orders (ISOCL ERP Stage 2) - API Integration Layer
 */

import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/delivery-orders';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const DeliveryOrderService = {
  /** @param {Object} params - { status, partyId, kamId, from, to, search, page, limit } */
  getOrders: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch delivery orders');
    }
  },

  getOrderById: async (doId) => {
    try {
      const response = await apiClient.get(`${BASE}/${doId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch delivery order');
    }
  },

  /**
   * Create an order. Omit sbRate to take the master rate; supplying one counts
   * as a manual override and requires rateRemark, which raises an approval.
   */
  createOrder: async (data) => {
    try {
      const response = await apiClient.post(BASE, data);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to create delivery order');
    }
  },

  updateOrder: async (doId, data) => {
    try {
      const response = await apiClient.patch(`${BASE}/${doId}`, data);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to update delivery order');
    }
  },

  /** Close early while balance remains. */
  completeOrder: async (doId, remarks) => {
    try {
      const response = await apiClient.post(`${BASE}/${doId}/complete`, { remarks });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to close delivery order');
    }
  },

  cancelOrder: async (doId, cancelReason) => {
    try {
      const response = await apiClient.post(`${BASE}/${doId}/cancel`, { cancelReason });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to cancel delivery order');
    }
  },

  /** Live credit position, shown on the form before submitting. */
  checkCredit: async (partyId) => {
    try {
      const response = await apiClient.get(`${BASE}/credit-check/${partyId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to check credit');
    }
  },
};

export default DeliveryOrderService;
