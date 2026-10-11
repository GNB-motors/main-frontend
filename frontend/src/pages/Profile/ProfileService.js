import apiClient from '../../utils/axiosConfig';
import { parseSafe } from '../../schemas/validate.js';
import ApiError from '../../errors/ApiError';

const getProfile = async () => {
  try {
    const response = await apiClient.get('/api/auth/me');
    // Handle new API response structure: {status: "success", data: {...}}
    if (response.data && response.data.status === 'success') {
      return response.data.data
        ? parseSafe(
            'profileSchema',
            () => import('../../schemas/profile.schema.js'),
            response.data.data,
          )
        : response.data.data;
    }
    // Fallback for old response structure
    return response.data;
  } catch (error) {
    // Rethrow the error so the component can handle it, including 404
    throw ApiError.from(error);
  }
};

const getUserInfo = async () => {
  try {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

export const ProfileService = {
  getProfile,
  getUserInfo,
};
