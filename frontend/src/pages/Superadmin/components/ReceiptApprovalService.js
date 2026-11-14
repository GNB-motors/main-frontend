import apiClient from '../../../utils/axiosConfig';
import ApiError from '../../../errors/ApiError';
import { parseSafe } from '../../../schemas/validate.js';
import { getVehicleList } from '../../../services/vehicleListService';

const call = async (request) => {
  try {
    return (await request).data?.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

/**
 * One page of the receipt-approval inbox, filtered and sorted on the server.
 * @param {object} params  see draftListParams
 * @returns {Promise<{ items: Array, total?: number, page?: number, totalPages?: number, summary?: object }>}
 */
const listDrafts = async (params, { signal } = {}) => {
  try {
    const res = await apiClient.get('/api/whatsapp/admin/drafts', { params, signal });
    return parseSafe(
      'draftListSchema',
      () => import('../../../schemas/whatsappDraft.schema.js'),
      res.data?.data ?? { items: [] },
    );
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** Draft counts per status tab: { READY, PUBLISHED, REJECTED, CLEARED }. */
const getDraftCounts = async ({ signal } = {}) => {
  try {
    const res = await apiClient.get('/api/whatsapp/admin/drafts/counts', { signal });
    return res.data?.data ?? null;
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** One draft with presigned image URLs, or null. */
const getDraft = async (draftId, { signal } = {}) =>
  (await call(apiClient.get(`/api/whatsapp/admin/drafts/${draftId}`, { signal }))) ?? null;

/**
 * Approve a draft. A chat-import row saves the fill with the values a person
 * changed in the drawer (truck, litres, amount, filling type, time); a guided
 * row is approved as it is.
 */
const publishDraft = (draftId, payload) => {
  const body = payload && Object.keys(payload).length ? payload : undefined;
  return call(apiClient.post(`/api/whatsapp/admin/drafts/${draftId}/publish`, body));
};

/** Mark a row as a market truck: a truck that is not in our fleet. */
const markDraftAsMarket = (draftId, payload) =>
  call(apiClient.post(`/api/whatsapp/admin/drafts/${draftId}/market`, payload || {}));

/** The org's vehicles, for the truck picker of a chat-import row. */
const listVehicles = async ({ signal } = {}) => (await getVehicleList({ signal })) || [];

const rejectDraft = (draftId, reason) =>
  call(apiClient.post(`/api/whatsapp/admin/drafts/${draftId}/reject`, { reason }));

const clearDraft = (draftId, note) =>
  call(apiClient.post(`/api/whatsapp/admin/drafts/${draftId}/clear`, { note }));

/**
 * The time of the fill, set by a person: 'accept' takes the predicted time,
 * 'set' takes the time the person typed. The prediction is kept.
 */
const setDraftTime = (draftId, { action = 'accept', at = null } = {}) =>
  call(
    apiClient.post(`/api/whatsapp/admin/drafts/${draftId}/time`, {
      action,
      ...(at ? { at } : {}),
    }),
  );

/** { successCount, failureCount, failed: [{ message }] } */
const bulkPublishDrafts = async (ids) =>
  (await call(apiClient.post('/api/whatsapp/admin/drafts/bulk-publish', { ids }))) || {};

export const ReceiptApprovalService = {
  listDrafts,
  getDraftCounts,
  getDraft,
  publishDraft,
  markDraftAsMarket,
  listVehicles,
  rejectDraft,
  clearDraft,
  setDraftTime,
  bulkPublishDrafts,
};
