import apiClient from '../../../utils/axiosConfig';
import ApiError from '../../../errors/ApiError';
import { parseSafe } from '../../../schemas/validate.js';

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

const publishDraft = (draftId) =>
  call(apiClient.post(`/api/whatsapp/admin/drafts/${draftId}/publish`));

const rejectDraft = (draftId, reason) =>
  call(apiClient.post(`/api/whatsapp/admin/drafts/${draftId}/reject`, { reason }));

const clearDraft = (draftId, note) =>
  call(apiClient.post(`/api/whatsapp/admin/drafts/${draftId}/clear`, { note }));

/** { successCount, failureCount, failed: [{ message }] } */
const bulkPublishDrafts = async (ids) =>
  (await call(apiClient.post('/api/whatsapp/admin/drafts/bulk-publish', { ids }))) || {};

const updateOdometerMode = (odometerMode) =>
  call(apiClient.patch('/api/whatsapp/settings', { odometerMode }));

export const ReceiptApprovalService = {
  listDrafts,
  getDraftCounts,
  getDraft,
  publishDraft,
  rejectDraft,
  clearDraft,
  bulkPublishDrafts,
  updateOdometerMode,
};
