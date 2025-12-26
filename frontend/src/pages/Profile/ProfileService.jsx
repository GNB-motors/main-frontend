import apiClient from '../../utils/axiosConfig';

const getProfile = async (token) => {
  try {
    const response = await apiClient.get('/api/auth/me');
    // Handle new API response structure: {status: "success", data: {...}}
    if (response.data && response.data.status === 'success') {
      return response.data.data;
    }
    // Fallback for old response structure
    return response.data;
  } catch (error) {
    // Rethrow the error so the component can handle it, including 404
    throw error.response?.data || { detail: error.message || 'Could not fetch profile.' };
  }
};

const getUserInfo = async () => {
  try {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: error.message || 'Could not fetch user information.' };
  }
};

export const ProfileService = {
  getProfile,
  getUserInfo,
};
