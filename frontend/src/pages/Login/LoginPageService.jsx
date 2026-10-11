import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';

const loginUser = async (credentials) => {
  try {
    // A wrong-password 401 is the form's own answer, never a lost session.
    const response = await apiClient.post('/api/auth/login', credentials, {
      skipAuthRedirect: true,
    });

    // Handle new response structure: { status: "success", data: { user, token } }
    if (response.data.status === 'success' && response.data.data) {
      return {
        user: response.data.data.user,
        token: response.data.data.token,
        organization: response.data.data.organization,
      };
    }

    // Fallback for old API structure
    return response.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

export const LoginPageService = {
  loginUser,
};
