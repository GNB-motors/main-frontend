import apiClient from '../../utils/axiosConfig';
import { ApiError } from '../../errors/ApiError';

const BASE = '/api/erp/finance-hub';
const LEDGER_BASE = '/api/erp/ledger';

/**
 * Keep the typed error intact. The status, the request id and the body are
 * what let the UI say "this module is not available" instead of "something
 * went wrong", and the request id is what support asks for. The raw server
 * text is never shown to the owner — the UI maps it to plain words.
 */
const unwrapError = (error, fallback) => {
  const apiError = ApiError.from(error, fallback);
  // legacy alias: several ERP screens read `err.payload`
  apiError.payload = error?.response?.data ?? apiError.body ?? null;
  return apiError;
};

/**
 * FinanceHubApi — the cross-module financial reads.
 *
 * Note `getSummary`: balances are always as-of `asOf` regardless of from/to;
 * only `cashMovement` respects the period. Screens must label the two
 * differently or a reader will take a stock figure for a flow.
 */
const FinanceHubApi = {
  getSummary: async (params = {}, opts = {}) => {
    try {
      const res = await apiClient.get(`${BASE}/summary`, { params, signal: opts.signal });
      return res.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to load financial summary');
    }
  },

  getAgeing: async (params = {}, opts = {}) => {
    try {
      const res = await apiClient.get(`${BASE}/ageing`, { params, signal: opts.signal });
      return res.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to load ageing');
    }
  },

  /** Account directory — the only way to browse to an Account 360. */
  listAccounts: async (params = {}, opts = {}) => {
    try {
      const res = await apiClient.get(`${BASE}/accounts`, { params, signal: opts.signal });
      return res.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to load accounts');
    }
  },

  getBalancesByAccountType: async (params = {}, opts = {}) => {
    try {
      const res = await apiClient.get(`${BASE}/balances`, { params, signal: opts.signal });
      return res.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to load balances');
    }
  },

  /** Ledger postings, settlement history and timeline for one document. */
  getDocumentActivity: async (docType, docId, opts = {}) => {
    try {
      const res = await apiClient.get(`${BASE}/document/${docType}/${docId}/activity`, {
        signal: opts.signal,
      });
      return res.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to load document activity');
    }
  },
};

/**
 * The day book. Unlike /statement this does not require an account, which is
 * what makes "everything posted today" answerable.
 */
export const LedgerEntriesApi = {
  list: async (params = {}, opts = {}) => {
    try {
      const res = await apiClient.get(`${LEDGER_BASE}/entries`, {
        params,
        signal: opts.signal,
      });
      return res.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to load ledger entries');
    }
  },

  exportCsv: async (params = {}) => {
    try {
      const res = await apiClient.get(`${LEDGER_BASE}/entries`, {
        params: { ...params, format: 'csv' },
        responseType: 'blob',
      });
      return res.data;
    } catch (error) {
      throw unwrapError(error, 'Failed to export day book');
    }
  },
};

export default FinanceHubApi;
