import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';

const updateOrganization = async (organizationData, orgId) => {
  try {
    // PATCH /api/admin/organizations/:id - Update organization details
    const response = await apiClient.patch(`/api/admin/organizations/${orgId}`, organizationData);
    return response.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

const updateUserProfile = async (profileData) => {
  try {
    // PATCH /api/auth/me - Update user profile including theme color
    const response = await apiClient.patch('/api/auth/me', profileData);
    return response.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

const completeOnboarding = async (onboardingData, orgId) => {
  // Step 1: Update organization with company details (companyName, gstin)
  const organizationPayload = {
    companyName: onboardingData.companyName,
  };

  // Only include gstin if it's not empty
  if (onboardingData.gstin && onboardingData.gstin.trim()) {
    organizationPayload.gstin = onboardingData.gstin;
  }

  await updateOrganization(organizationPayload, orgId);

  // Step 2: Update user profile with theme color
  const profilePayload = {
    firstName: onboardingData.firstName,
    lastName: onboardingData.lastName,
  };

  // Only include primaryThemeColor if provided
  if (onboardingData.primaryThemeColor) {
    profilePayload.primaryThemeColor = onboardingData.primaryThemeColor;
  }

  await updateUserProfile(profilePayload);

  return { success: true, message: 'Onboarding completed successfully' };
};

export const OnboardingService = {
  completeOnboarding,
  updateOrganization,
  updateUserProfile,
};
