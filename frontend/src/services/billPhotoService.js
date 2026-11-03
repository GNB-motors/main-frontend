import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';

/**
 * billPhotoService — upload a bill photo and ask which truck it belongs to.
 *
 * The upload reuses the existing capture endpoint the driver app already
 * uses; the suggestion comes from the new fleet-view endpoint.
 */

/**
 * POST /api/app/v2/captures — the bill photo itself.
 * `body` is the multipart FormData, with `file` and `kind` already in it.
 * The response is the existing capture contract.
 */
export const uploadBillPhoto = async ({ body, signal } = {}) => {
  try {
    const res = await apiClient.post('/api/app/v2/captures', body, {
      signal,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const payload = res?.data;
    if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
    return payload;
  } catch (error) {
    throw ApiError.from(error);
  }
};

/**
 * GET /api/fleet-view/bills/:captureId/suggestion — which truck is this?
 */
export const getBillSuggestion = async (captureId, { signal } = {}) => {
  try {
    const res = await apiClient.get(
      `/api/fleet-view/bills/${encodeURIComponent(captureId)}/suggestion`,
      { signal },
    );
    const payload = res?.data;
    if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
    return payload;
  } catch (error) {
    throw ApiError.from(error);
  }
};

export const billPhotoService = { uploadBillPhoto, getBillSuggestion };

export default billPhotoService;
