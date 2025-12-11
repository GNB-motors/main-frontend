import axios from 'axios';

// Get the backend URL from environment variables or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const completeOnboarding = async (onboardingData, token, orgId) => {
  try {
    // Use the new API endpoint: PATCH /admin/organizations/:id
    const response = await axios.patch(
      `${API_BASE_URL}/api/admin/organizations/${orgId}`,
      onboardingData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // Return the response data
    return response.data;
  } catch (error) {
    // Rethrow the error so the component can handle it
    throw error.response?.data || { detail: error.message || 'An unknown error occurred during onboarding.' };
  }
};

export const OnboardingService = {
  completeOnboarding,
};