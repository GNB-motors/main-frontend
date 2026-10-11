import axios from 'axios';
import ApiError from '../../errors/ApiError';

// Get the backend URL from environment variables or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const registerUser = async (userData) => {
  try {
    // Backend owner-registration endpoint (SUPER_ADMIN only). The page that uses
    // this service is at /admin/new-user, so /api/admin/register-owner is the
    // route that actually exists; /api/v1/auth/register is not mounted.
    const response = await axios.post(`${API_BASE_URL}/api/admin/register-owner`, userData);
    // Return the full response data which includes the token
    return response.data;
  } catch (error) {
    // Rethrow the error so the component can handle it
    // Include the response data if available, as it might contain specific error messages from the backend
    throw ApiError.from(error);
  }
};

export const SignUpPageService = {
  registerUser,
};
