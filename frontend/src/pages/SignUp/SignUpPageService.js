import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';

const registerUser = async (userData) => {
  try {
    // Backend owner-registration endpoint (SUPER_ADMIN only). The page that uses
    // this service is at /admin/new-user, so /api/admin/register-owner is the
    // route that actually exists; /api/v1/auth/register is not mounted.
    const response = await apiClient.post('/api/admin/register-owner', userData);
    // Return the full response data which includes the token
    return response.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

export const SignUpPageService = {
  registerUser,
};
