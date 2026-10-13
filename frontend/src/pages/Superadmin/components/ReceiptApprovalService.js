import apiClient from '../../../utils/axiosConfig';
import ApiError from '../../../errors/ApiError';
import { parseSafe } from '../../../schemas/validate.js';

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

export const ReceiptApprovalService = { listDrafts, getDraftCounts };
