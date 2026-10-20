import apiClient from '../../utils/axiosConfig';

const BASE = '/api/fleetedge/accounts';

export const listAccounts = async ({ signal } = {}) => {
  const res = await apiClient.get(BASE, { signal });
  return res.data.data.accounts;
};

export const updateAccount = async (id, payload) => {
  await apiClient.patch(`${BASE}/${id}`, payload);
};

export const deleteAccount = async (id) => {
  const res = await apiClient.delete(`${BASE}/${id}`);
  return res.data;
};

export const getDrift = async (page = 1, limit = 50, { signal } = {}) => {
  const res = await apiClient.get(`${BASE}/drift`, { params: { page, limit }, signal });
  return res.data.data;
};

export const reassignVehicleAccount = async (vehicleId, fleetEdgeAccountId) => {
  await apiClient.patch(`/api/vehicles/${vehicleId}/fleet-edge-account`, { fleetEdgeAccountId });
};
