import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';
import { mapAdBlueLogResponse } from './adBlueTrackingLogic';

const call = async (request) => {
  try {
    return await request();
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** Response body of GET /api/mileage/intervals (one page, optionally one vehicle). */
const listIntervals = (params, { signal } = {}) =>
  call(async () => (await apiClient.get('/api/mileage/intervals', { params, signal })).data);

/** Response body of GET /api/mileage/intervals/:id. */
const getInterval = (id, { signal } = {}) =>
  call(async () => (await apiClient.get(`/api/mileage/intervals/${id}`, { signal })).data);

/**
 * Response body of GET /api/mileage/model-comparison.
 *
 * The read is slow (tens of seconds on a big org) and the hub asks for it
 * twice at once (the km/L tile and the By-model view), so identical requests
 * share one call for a minute. The shared call is not tied to either caller's
 * AbortSignal: one caller leaving must not cancel the other's answer.
 */
const MODEL_COMPARISON_TTL_MS = 60 * 1000;
const modelComparisonCalls = new Map();
const getModelComparison = (params) => {
  const key = JSON.stringify(params ?? {});
  const hit = modelComparisonCalls.get(key);
  if (hit && Date.now() - hit.at < MODEL_COMPARISON_TTL_MS) return hit.promise;
  const promise = call(
    async () => (await apiClient.get('/api/mileage/model-comparison', { params })).data,
  );
  modelComparisonCalls.set(key, { at: Date.now(), promise });
  // A failed read is not kept: the next caller tries again.
  promise.catch(() => modelComparisonCalls.delete(key));
  return promise;
};

/** One page of AdBlue logs, mapped to table rows. */
const listAdBlueLogs = ({ page, limit, search, signal } = {}) =>
  call(async () => {
    const params = { page, limit };
    if (search) params.search = search;
    const response = await apiClient.get('/api/adblue-logs', { params, signal });
    if (response.data.status === 'success') {
      const mapped = mapAdBlueLogResponse(response.data.data);
      return { logs: mapped, total: response.data.meta?.total ?? mapped.length };
    }
    return { logs: [], total: 0 };
  });

const createAdBlueLog = (payload) =>
  call(async () => (await apiClient.post('/api/adblue-logs', payload, { timeout: 60000 })).data);

const updateAdBlueLog = (id, body) =>
  call(async () => (await apiClient.put(`/api/adblue-logs/${id}`, body)).data);

const deleteAdBlueLog = (id) =>
  call(async () => (await apiClient.delete(`/api/adblue-logs/${id}`)).data);

/** Uploads an AdBlue receipt as a vehicle document; resolves to its id. */
const uploadReceipt = (formData) =>
  call(async () => {
    const receiptRes = await apiClient.post('/api/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return receiptRes.data.data?._id || receiptRes.data._id;
  });

export const MileageTrackingService = {
  listIntervals,
  getInterval,
  getModelComparison,
  listAdBlueLogs,
  createAdBlueLog,
  updateAdBlueLog,
  deleteAdBlueLog,
  uploadReceipt,
};
