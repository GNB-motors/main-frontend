import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';

/**
 * Saved route points (trip source/destination) for LocationAutocomplete.
 * `orgId`, when given, overrides the session org via X-Org-Id (superadmin
 * forms acting on another organisation).
 */
const orgHeaders = (orgId) => (orgId ? { 'X-Org-Id': orgId } : undefined);

const searchLocations = async ({ search, orgId, signal } = {}) => {
  try {
    const res = await apiClient.get('/api/locations', {
      params: { search, limit: 10 },
      headers: orgHeaders(orgId),
      signal,
    });
    return res.data?.results || [];
  } catch (error) {
    throw ApiError.from(error);
  }
};

const createLocation = async (payload, { orgId } = {}) => {
  try {
    const res = await apiClient.post('/api/locations', payload, { headers: orgHeaders(orgId) });
    return res.data?.data || res.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

const SavedLocationService = { searchLocations, createLocation };

export default SavedLocationService;
