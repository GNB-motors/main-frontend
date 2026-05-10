import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const BASE = `${API_BASE_URL}/api/fleetedge/accounts`;

function headers(token) {
  return { Authorization: `Bearer ${token}` };
}

export const listAccounts = async (token) => {
  const res = await axios.get(BASE, { headers: headers(token) });
  return res.data.data.accounts;
};

export const createAccount = async (token, payload) => {
  const res = await axios.post(BASE, payload, { headers: headers(token) });
  return res.data.data.account;
};

export const updateAccount = async (token, id, payload) => {
  await axios.patch(`${BASE}/${id}`, payload, { headers: headers(token) });
};

export const deleteAccount = async (token, id) => {
  const res = await axios.delete(`${BASE}/${id}`, { headers: headers(token) });
  return res.data;
};

export const discoverVehicles = async (token, id) => {
  const res = await axios.post(`${BASE}/${id}/discover`, {}, { headers: headers(token) });
  return res.data.data.candidates;
};

export const assignVehicles = async (token, id, vehicleIds) => {
  const res = await axios.post(`${BASE}/${id}/assign`, { vehicleIds }, { headers: headers(token) });
  return res.data.data;
};

export const getDrift = async (token, page = 1, limit = 50) => {
  const res = await axios.get(`${BASE}/drift`, { params: { page, limit }, headers: headers(token) });
  return res.data.data;
};

export const reassignVehicleAccount = async (token, vehicleId, fleetEdgeAccountId) => {
  await axios.patch(
    `${API_BASE_URL}/api/vehicles/${vehicleId}/fleet-edge-account`,
    { fleetEdgeAccountId },
    { headers: headers(token) }
  );
};
