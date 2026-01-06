import axios from 'axios';

// Get the backend URL from environment variables or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const updateOrganization = async (organizationData, token, orgId) => {
  try {
    // PATCH /api/admin/organizations/:id - Update organization details
    const response = await axios.patch(
      `${API_BASE_URL}/api/admin/organizations/${orgId}`,
      organizationData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: error.message || 'Failed to update organization.' };
  }
};

const updateUserProfile = async (profileData, token) => {
  try {
    // PATCH /api/auth/me - Update user profile including theme color
    const response = await axios.patch(
      `${API_BASE_URL}/api/auth/me`,
      profileData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: error.message || 'Failed to update user profile.' };
  }
};

const completeOnboarding = async (onboardingData, token, orgId) => {
  try {
    // Step 1: Update organization with company details (companyName, gstin)
    const organizationPayload = {
      companyName: onboardingData.companyName,
    };
    
    // Only include gstin if it's not empty
    if (onboardingData.gstin && onboardingData.gstin.trim()) {
      organizationPayload.gstin = onboardingData.gstin;
    }
    
    await updateOrganization(organizationPayload, token, orgId);
    
    // Step 2: Update user profile with theme color
    const profilePayload = {
      firstName: onboardingData.firstName,
      lastName: onboardingData.lastName,
    };
    
    // Only include primaryThemeColor if provided
    if (onboardingData.primaryThemeColor) {
      profilePayload.primaryThemeColor = onboardingData.primaryThemeColor;
    }
    
    await updateUserProfile(profilePayload, token);
    
    return { success: true, message: 'Onboarding completed successfully' };
  } catch (error) {
    throw error;
  }
};

export const OnboardingService = {
  completeOnboarding,
  updateOrganization,
  updateUserProfile,
};