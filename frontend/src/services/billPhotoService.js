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
/**
 * The bill captures of one queue. `source` says which queue: "office" is the
 * bills owners and managers upload.
 */
export const listBillCaptures = async ({
  status,
  uploaderRole,
  source,
  page = 1,
  limit = 50,
  signal,
} = {}) => {
  const res = await apiClient.get(base, {
    params: {
      status,
      ...(uploaderRole && { uploaderRole }),
      ...(source && { source }),
      page,
      limit,
    },
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
/**
 * Pair a slip with its odometer photo, or refuse the pair the server
 * proposed. A refused odometer photo is never proposed for that slip again.
 */
export const pairBills = async ({ slipCaptureId, odometerCaptureId, verdict }) => {
  const res = await apiClient.post(`${base}/pairs`, {
    slipCaptureId,
    odometerCaptureId,
    verdict,
  });
  return res.data?.data;
};
/** Take the odometer photo off this slip: "not this one". */
export const unpairBill = async (slipCaptureId) => {
  const res = await apiClient.delete(`${capturePath(slipCaptureId)}/pair`);
  return res.data?.data;
};
/**
 * Reject bills that are not confirmed yet. Nothing is deleted: they move to
 * Rejected. The server answers one result per bill, so a bill confirmed in
 * the meantime comes back as left alone instead of failing the rest.
 */
export const rejectBillCaptures = async (captureIds, reason) => {
  const res = await apiClient.post(`${base}/rejections`, { captureIds, reason: reason || null });
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
  pairBills,
  unpairBill,
  rejectBillCaptures,
  editBillLink,
  getBillLinkHistory,
};
