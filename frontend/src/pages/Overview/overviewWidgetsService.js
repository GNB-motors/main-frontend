import apiClient from '../../utils/axiosConfig';
import { parseWith } from '../../schemas/validate.js';

/**
 * Data layer for the Overview MetricTile widgets (Workstream H step 4).
 * Every fetcher:
 *  - passes the AbortSignal through to axios (rule 9 — abort on unmount),
 *  - parses the response with its zod schema before returning it (rule 10),
 *  - throws an Error carrying `status` so the tile mappers can derive honest
 *    MetricTile states: 403 → permission-denied, 404 → not-set-up, anything
 *    else (5xx, network) → error. Never a fabricated number.
 */

const shapedError = (error, fallback) => {
  const payload = error.response?.data;
  const err = new Error(payload?.message || payload?.detail || error.message || fallback);
  err.status = error.response?.status ?? null;
  err.payload = payload;
  return err;
};

export const OverviewWidgetsService = {
  /**
   * Latest live position rows for the org.
   * GET /api/livetracking/positions — same feed the Live Tracking map polls.
   * @returns {Promise<Array>} rows of { registrationNumber, state, isStale, ... }
   */
  getFleetPositions: async ({ signal } = {}) => {
    try {
      const response = await apiClient.get('/api/livetracking/positions', { signal });
      const parsed = await parseWith(
        'livePositionsResponseSchema',
        () => import('./overviewWidgets.schema.js'),
        response.data,
      );
      return parsed.data.records;
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error;
      throw shapedError(error, 'Could not fetch live positions.');
    }
  },

  /**
   * Pending approval counts (ERP engine) + pending driver bills (app loop).
   * Two live feeds fetched together; the "Needs you today" tile is their sum,
   * so a failure on either one fails the tile rather than showing a partial
   * count as if it were complete.
   * @returns {Promise<{ approvals: {total}, bills: {total} }>}
   */
  getNeedsToday: async ({ signal } = {}) => {
    try {
      const [approvalsRes, billsRes] = await Promise.all([
        apiClient.get('/api/erp/approvals/summary', { signal }),
        apiClient.get('/api/app/v1/bills', { params: { status: 'PENDING', limit: 1 }, signal }),
      ]);
      const approvals = await parseWith(
        'erpApprovalsSummarySchema',
        () => import('./overviewWidgets.schema.js'),
        approvalsRes.data,
      );
      const bills = await parseWith(
        'appBillsListSchema',
        () => import('./overviewWidgets.schema.js'),
        billsRes.data,
      );
      return { approvals, bills };
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error;
      throw shapedError(error, 'Could not fetch pending approvals.');
    }
  },

  /**
   * Idling rollup by vehicle for a window.
   * GET /api/idling-reports/summary — cron-populated telemetry; an empty array
   * is a legitimate response (org has no idling reports yet).
   * @param {object} params - { startDate, endDate } ISO strings
   * @returns {Promise<Array>} rows of { _id, totalIdleHours, totalWasteInr, ... }
   */
  getIdlingSummary: async (params = {}, { signal } = {}) => {
    try {
      const response = await apiClient.get('/api/idling-reports/summary', { params, signal });
      const parsed = await parseWith(
        'idlingSummaryResponseSchema',
        () => import('./overviewWidgets.schema.js'),
        response.data,
      );
      return parsed.data;
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error;
      throw shapedError(error, 'Could not fetch idling summary.');
    }
  },

  /**
   * Fuel spend rollup for a window.
   * GET /api/fuel-spend/summary — ₹ view over tripfuellogs (actual receipts).
   * @param {object} params - { from, to } ISO strings
   * @returns {Promise<object>} { totals: { litres, amountInr, logCount, ... } }
   */
  getFuelSpendSummary: async (params = {}, { signal } = {}) => {
    try {
      const response = await apiClient.get('/api/fuel-spend/summary', { params, signal });
      const parsed = await parseWith(
        'fuelSpendSummarySchema',
        () => import('./overviewWidgets.schema.js'),
        response.data,
      );
      return parsed.data;
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error;
      throw shapedError(error, 'Could not fetch fuel spend.');
    }
  },
};

export default OverviewWidgetsService;
