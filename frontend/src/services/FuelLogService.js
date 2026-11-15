import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';
import { parseSafe } from '../schemas/validate';

const schemas = () => import('../schemas/fuelLog.schema.js');

/** Manual diesel fuel-log entry (FuelLogForm): prior reading, slip upload, submit. */

/** The vehicle's latest fuel log, or null when it has none. */
const getLastOdometer = async (vehicleId, { signal } = {}) => {
  try {
    const res = await apiClient.get(`/api/mileage/last-odometer/${vehicleId}`, { signal });
    return await parseSafe('lastFuelLogSchema', schemas, res.data?.data || null);
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** Uploads one document (multipart FormData); resolves to the response body. */
const uploadDocument = async (formData, { signal } = {}) => {
  try {
    const res = await apiClient.post('/api/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      signal,
    });
    return await parseSafe('fuelDocumentResponseSchema', schemas, res.data);
  } catch (error) {
    throw ApiError.from(error);
  }
};

const createFuelLog = async (payload, { signal } = {}) => {
  try {
    const res = await apiClient.post('/api/mileage/fuel-log', payload, { timeout: 60000, signal });
    return await parseSafe('createdFuelLogSchema', schemas, res.data?.data || res.data);
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** One abortable save, with optional evidence uploaded before the fuel record. */
const submitEntry = async ({ payload, documents }, { signal } = {}) => {
  const body = { ...payload };
  for (const [type, doc] of Object.entries(documents || {})) {
    if (!doc || (type === 'odometer' && payload.fillingType !== 'FULL_TANK')) continue;
    signal?.throwIfAborted();
    const form = new FormData();
    form.append('file', doc.file);
    form.append('docType', type === 'fuel' ? 'FUEL_SLIP' : 'ODOMETER');
    form.append('entityType', 'VEHICLE');
    form.append('entityId', payload.vehicleId);
    if (doc.ocrData) form.append('ocrData', JSON.stringify(doc.ocrData));
    const result = await uploadDocument(form, { signal });
    const id = result.data?._id || result._id;
    if (!id) throw new ApiError('Photo upload did not return a document ID. Please try again.');
    body[type === 'fuel' ? 'documentId' : 'odometerDocId'] = id;
  }
  signal?.throwIfAborted();
  return createFuelLog(body, { signal });
};

const FuelLogService = { getLastOdometer, uploadDocument, createFuelLog, submitEntry };

export default FuelLogService;
