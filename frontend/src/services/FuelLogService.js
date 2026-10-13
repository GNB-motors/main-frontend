import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';

/** Manual diesel fuel-log entry (FuelLogForm): prior reading, slip upload, submit. */

/** The vehicle's latest fuel log, or null when it has none. */
const getLastOdometer = async (vehicleId, { signal } = {}) => {
  try {
    const res = await apiClient.get(`/api/mileage/last-odometer/${vehicleId}`, { signal });
    return res.data?.data || null;
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** Uploads one document (multipart FormData); resolves to the response body. */
const uploadDocument = async (formData) => {
  try {
    const res = await apiClient.post('/api/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return res.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

const createFuelLog = async (payload) => {
  try {
    const res = await apiClient.post('/api/mileage/fuel-log', payload, { timeout: 60000 });
    return res.data?.data || res.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

const FuelLogService = { getLastOdometer, uploadDocument, createFuelLog };

export default FuelLogService;
