import apiClient from '../../../../utils/axiosConfig';
import ApiError from '../../../../errors/ApiError';

/** Every organization with its featureFlags map (SUPER_ADMIN). */
const getOrganizations = async ({ signal } = {}) => {
  try {
    const response = await apiClient.get('/api/admin/organizations', { signal });
    return response.data?.data ?? [];
  } catch (error) {
    throw ApiError.from(error);
  }
};

export const LemuFlagsService = {
  getOrganizations,
};
