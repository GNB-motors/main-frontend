import axios from 'axios';

// Get the backend URL from environment variables or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const loginUser = async (credentials) => {
  try {
    // Updated to use new API endpoint without /v1
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
    
    // Handle new response structure: { status: "success", data: { user, token } }
    if (response.data.status === 'success' && response.data.data) {
      return {
        user: response.data.data.user,
        token: response.data.data.token,
      };
    }
    
    // Fallback for old API structure
    return response.data;
  } catch (error) {
    // Rethrow the error so the component can handle it
    // Include the response data if available, as it might contain specific error messages from the backend
    throw error.response?.data || { detail: error.message || 'An unknown error occurred during login.' };
  }
};

export const LoginPageService = {
  loginUser,
};