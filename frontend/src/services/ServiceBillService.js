import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';

/**
 * ServiceBillService — "service done, where's the bill?" (00_PLAN item 19).
 *
 * Every payload from these endpoints is a JOIN, not a new collection: the
 * service is a MaintenanceRecord, the bill is an Expense, and the two keep their
 * own amounts. A missing bill arrives as `state: 'NO_BILL'` with `bill: null`
 * and `estimate.kind: 'UNKNOWN'` — never as an amount of 0, and never as paid.
 * Render what comes back; do not fill gaps with zeroes.
 */
const get = async (path, params = {}, signal) => {
  try {
    const response = await apiClient.get(path, { params, signal });
    return response.data;
  } catch (error) {
    if (error?.code === 'ERR_CANCELED') throw error;
    throw ApiError.from(error);
  }
};

const post = async (path, body, signal) => {
  try {
    const response = await apiClient.post(path, body, { signal });
    return response.data?.data || response.data;
  } catch (error) {
    if (error?.code === 'ERR_CANCELED') throw error;
    throw ApiError.from(error);
  }
};

/**
 * Services joined to their bills. `meta.summary` counts ITEMS, not rupees —
 * `noBill` is how many services have no bill, never a total of nothing.
 */
const list = async (params = {}, signal) => {
  const res = await get('/api/service-bill', params, signal);
  return {
    data: Array.isArray(res?.data) ? res.data : [],
    meta: res?.meta || { total: 0, page: 1, limit: 50, totalPages: 1, summary: {} },
  };
};

/** One item in full: both money figures named, every document with its OCR confidence. */
const getItem = async (itemId, signal) => {
  const res = await get(`/api/service-bill/${encodeURIComponent(itemId)}`, {}, signal);
  return res?.data || null;
};

/** Point a real Expense at the service it pays for. Nothing is copied or deleted. */
const linkBill = async (itemId, expenseId) =>
  post(`/api/service-bill/${encodeURIComponent(itemId)}/bill`, { expenseId });

/** Record that no bill is coming — warranty, AMC, goodwill. A reason is required. */
const closeWithoutBill = async (itemId, note) =>
  post(`/api/service-bill/${encodeURIComponent(itemId)}/close`, { note });

export const ServiceBillService = { list, getItem, linkBill, closeWithoutBill };

export default ServiceBillService;
