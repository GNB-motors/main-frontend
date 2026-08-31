/**
 * Supplier invoices & payments (ISOCL ERP Stage 14)
 */

import apiClient from '../../utils/axiosConfig';

const INVOICE_BASE = '/api/erp/supplier-invoices';
const PAYMENT_BASE = '/api/erp/supplier-payments';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
};

const SupplierInvoiceApi = {
  create: async (body) => {
    try {
      const response = await apiClient.post(INVOICE_BASE, body);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to create supplier invoice');
    }
  },

  list: async (params = {}) => {
    try {
      const response = await apiClient.get(INVOICE_BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch supplier invoices');
    }
  },
};

const SupplierPaymentApi = {
  /** Payment history — endpoint existed, client method did not. */
  list: async (params = {}) => {
    try {
      const response = await apiClient.get(PAYMENT_BASE, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch supplier payments');
    }
  },

  getOutstanding: async (params = {}) => {
    try {
      const response = await apiClient.get(`${PAYMENT_BASE}/outstanding`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch outstanding supplier invoices');
    }
  },

  checkOnAccount: async (supplierId) => {
    try {
      const response = await apiClient.get(`${PAYMENT_BASE}/on-account/${supplierId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to check on-account');
    }
  },

  create: async (body) => {
    try {
      const response = await apiClient.post(PAYMENT_BASE, body);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to submit supplier payment');
    }
  },

  listPendingRelease: async (params = {}) => {
    try {
      const response = await apiClient.get(`${PAYMENT_BASE}/pending-release`, { params });
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to fetch pending release');
    }
  },

  release: async (id, body) => {
    try {
      const response = await apiClient.post(`${PAYMENT_BASE}/${id}/release`, body);
      return response.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to release payment');
    }
  },
};

export { SupplierInvoiceApi, SupplierPaymentApi };
