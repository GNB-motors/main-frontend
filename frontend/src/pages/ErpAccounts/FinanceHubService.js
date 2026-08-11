import apiClient from '../../utils/axiosConfig';

const BASE = '/api/erp/finance-hub';
const LEDGER_BASE = '/api/erp/ledger';

const unwrapError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || error.message || fallback);
  err.status = error.response?.status;
  err.payload = payload;
  return err;
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
      const res = await apiClient.get(
        `${BASE}/document/${docType}/${docId}/activity`,
        { signal: opts.signal },
      );
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
