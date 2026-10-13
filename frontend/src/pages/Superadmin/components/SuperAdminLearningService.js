import apiClient from '../../../utils/axiosConfig';
import ApiError from '../../../errors/ApiError';

/** Organizations for the org picker: the enveloped list, else the bare body, else []. */
const listOrganizations = async ({ signal } = {}) => {
  try {
    const res = await apiClient.get('/api/admin/organizations', { signal });
    return res.data?.data ?? res.data ?? [];
  } catch (error) {
    throw ApiError.from(error);
  }
};

export const SuperAdminLearningService = { listOrganizations };
