import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';

/**
 * BillExtractionService — workshop bills read by OCR.
 *
 * Every value these endpoints return is a CLAIM: it comes off a photo and has a
 * confidence attached. Nothing here applies anything to a maintenance record —
 * the review call is where a person decides, one field at a time.
 */

/** Upload one bill photo. Resolves to the stored extraction. */
const scanBill = async ({ vehicleId, maintenanceRecordId, file }) => {
  try {
    const formData = new FormData();
    formData.append('vehicleId', vehicleId);
    if (maintenanceRecordId) formData.append('maintenanceRecordId', maintenanceRecordId);
    formData.append('files', file);
    const res = await apiClient.post('/api/maintenance/bills/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return res.data?.data || null;
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** The bill queue. `reviewed`: 'false' = to review, 'true' = already read. */
const listBills = async ({ vehicleId, reviewed, page, limit, signal } = {}) => {
  try {
    const res = await apiClient.get('/api/maintenance/bills', {
      params: { vehicleId, reviewed, page, limit },
      signal,
    });
    return { data: res.data?.data || [], meta: res.data?.meta || null };
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** One extraction with its evidence and its disagreements. */
const getBill = async (id, { signal } = {}) => {
  try {
    const res = await apiClient.get(`/api/maintenance/bills/${id}`, { signal });
    return res.data?.data || null;
  } catch (error) {
    throw ApiError.from(error);
  }
};

/**
 * Record a decision per field. One of ACCEPT | CORRECT | REJECT | KEEP_RECORDED.
 * KEEP_RECORDED is the "the bill reads differently and the record stands" answer.
 */
const reviewBill = async (id, payload) => {
  try {
    const res = await apiClient.post(`/api/maintenance/bills/${id}/review`, payload);
    return res.data?.data || null;
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** This org's confidence floor, or null when it has not set one. */
const getBillSettings = async () => {
  try {
    const res = await apiClient.get('/api/maintenance/bills/settings');
    return res.data?.data || { minFieldConfidence: null };
  } catch (error) {
    throw ApiError.from(error);
  }
};

const setBillSettings = async (payload) => {
  try {
    const res = await apiClient.put('/api/maintenance/bills/settings', payload);
    return res.data?.data || null;
  } catch (error) {
    throw ApiError.from(error);
  }
};

const BillExtractionService = {
  scanBill,
  listBills,
  getBill,
  reviewBill,
  getBillSettings,
  setBillSettings,
};

export default BillExtractionService;