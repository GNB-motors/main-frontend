import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';

/** Upload a confirmed fuel bill for an explicit vehicle. OCR and review happen on the server. */
export const uploadBillPhoto = async ({ body, signal } = {}) => {
  try {
    const response = await apiClient.post('/api/mileage/fuel-log/from-photo', body, {
      signal,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return response.data?.data ?? response.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

const base = '/api/fleet-view/bills';
const capturePath = (id) => `${base}/${encodeURIComponent(id)}`;

/**
 * Upload one bill photo as a capture. The server reads it, suggests the truck
 * and keeps the photo until the owner confirms the link in "Bills to confirm".
 */
export const uploadBillCapture = async ({ body, clientId, signal } = {}) => {
  try {
    const res = await apiClient.post(`${base}/captures`, body, {
      signal,
      headers: { 'Idempotency-Key': clientId },
    });
    return res.data?.data?.capture;
  } catch (error) {
    throw ApiError.from(error);
  }
};
export const listBillCaptures = async ({
  status,
  uploaderRole,
  page = 1,
  limit = 50,
  signal,
} = {}) => {
  const res = await apiClient.get(base, {
    params: { status, ...(uploaderRole && { uploaderRole }), page, limit },
    signal,
  });
  return res.data?.data;
};
export const getBillSuggestion = async (captureId, { signal } = {}) => {
  const res = await apiClient.get(`${capturePath(captureId)}/suggestion`, { signal });
  return res.data?.data;
};
export const getBillPage = async (captureId, index = 0, { signal } = {}) => {
  const res = await apiClient.get(`${capturePath(captureId)}/pages/${index}`, {
    signal,
    responseType: 'blob',
  });
  return res.data;
};
export const saveBillLinks = async (links) => {
  const res = await apiClient.post(`${base}/confirmations`, { links });
  return res.data?.data;
};
export const editBillLink = async (captureId, body) => {
  const res = await apiClient.patch(`${capturePath(captureId)}/link`, body);
  return res.data?.data;
};
export const getBillLinkHistory = async (captureId, { signal } = {}) => {
  const res = await apiClient.get(`${capturePath(captureId)}/history`, { signal });
  return res.data?.data;
};

export default {
  uploadBillPhoto,
  uploadBillCapture,
  listBillCaptures,
  getBillSuggestion,
  getBillPage,
  saveBillLinks,
  editBillLink,
  getBillLinkHistory,
};
