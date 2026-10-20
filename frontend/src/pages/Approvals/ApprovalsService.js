import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';

/** WhatsApp fuel bills waiting for approval (drafts in READY), for the tab badge. */
const getWhatsAppPendingCount = async ({ signal } = {}) => {
  try {
    const res = await apiClient.get('/api/whatsapp/admin/drafts/counts', { signal });
    return res.data?.data?.READY ?? 0;
  } catch (error) {
    throw ApiError.from(error);
  }
};

export const ApprovalsService = { getWhatsAppPendingCount };
