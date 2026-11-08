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

export default { uploadBillPhoto };
