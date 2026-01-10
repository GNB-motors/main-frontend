// Utility for location API calls
import apiClient from '../utils/axiosConfig';

// POST /api/locations - Create a new location
export async function createLocation({ type, name, address, city, state, lat, lng }) {
  const res = await apiClient.post('/api/locations', {
    type,
    name: name?.trim(),
    address: address?.trim() || '',
    city: city?.trim() || '',
    state: state?.trim() || '',
    lat,
    lng,
  });
  return res.data;
}

// DELETE /api/locations/:id - Delete location
export async function deleteLocation(locationId) {
  const res = await apiClient.delete(`/api/locations/${locationId}`);
  return res.data;
}
