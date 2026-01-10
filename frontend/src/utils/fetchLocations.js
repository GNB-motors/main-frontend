// Get all locations from API
import apiClient from '../utils/axiosConfig';

// GET /api/locations - Get paginated list of locations (for dropdown, get all)
export async function fetchLocations() {
  const res = await apiClient.get('/api/locations');
  return res.data;
}
