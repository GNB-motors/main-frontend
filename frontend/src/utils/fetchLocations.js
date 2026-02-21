// Get all locations from API
import apiClient from '../utils/axiosConfig';

// GET /api/locations - Get paginated list of locations (for dropdown, get all)
export async function fetchLocations(params = {}) {
  const res = await apiClient.get('/api/locations', { params });
  return res.data;
}
