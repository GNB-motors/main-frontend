import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// Build a FormData payload for create/update. `attachments` is an array of File/Blob.
const buildFormData = (payload, attachments) => {
  const fd = new FormData();
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    fd.append(k, v instanceof Date ? v.toISOString() : v);
  });
  (attachments || []).forEach((f) => fd.append('files', f));
  return fd;
};

const listRecords = async (token, { recordType, vehicleId, search, page = 1, limit = 50 } = {}) => {
  const params = new URLSearchParams();
  if (recordType) params.set('recordType', recordType);
  if (vehicleId) params.set('vehicleId', vehicleId);
  if (search) params.set('search', search);
  params.set('page', page);
  params.set('limit', limit);

  try {
    const res = await axios.get(`${API_BASE_URL}/api/maintenance?${params}`, {
      headers: authHeader(token),
    });
    return {
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      meta: res.data?.meta || { total: 0, page: 1, limit, totalPages: 1 },
    };
  } catch (err) {
    console.error('listRecords error', err.response?.data || err.message);
    throw err.response?.data || { detail: 'Failed to load records' };
  }
};

const createRecord = async (token, payload, attachments) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/maintenance`, buildFormData(payload, attachments), {
      headers: { ...authHeader(token), 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data || res.data;
  } catch (err) {
    console.error('createRecord error', err.response?.data || err.message);
    throw err.response?.data || { detail: 'Failed to create record' };
  }
};

const updateRecord = async (token, id, payload, attachments) => {
  try {
    const res = await axios.patch(
      `${API_BASE_URL}/api/maintenance/${id}`,
      buildFormData(payload, attachments),
      { headers: { ...authHeader(token), 'Content-Type': 'multipart/form-data' } },
    );
    return res.data?.data || res.data;
  } catch (err) {
    console.error('updateRecord error', err.response?.data || err.message);
    throw err.response?.data || { detail: 'Failed to update record' };
  }
};

const deleteRecord = async (token, id) => {
  try {
    const res = await axios.delete(`${API_BASE_URL}/api/maintenance/${id}`, {
      headers: authHeader(token),
    });
    return res.data;
  } catch (err) {
    console.error('deleteRecord error', err.response?.data || err.message);
    throw err.response?.data || { detail: 'Failed to delete record' };
  }
};

// Org's saved dropdown options. Workshop list starts empty; service/repair type
// lists are merged with frontend defaults inside the modal.
// System-generated alerts (no caching server-side; refetch to refresh).
const getAlerts = async (token) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/maintenance/alerts`, {
      headers: authHeader(token),
    });
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (err) {
    console.error('getAlerts error', err.response?.data || err.message);
    throw err.response?.data || { detail: 'Failed to load alerts' };
  }
};

const getOptions = async (token) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/maintenance/options`, {
      headers: authHeader(token),
    });
    return res.data?.data || { workshops: [], serviceTypes: [], repairTypes: [] };
  } catch (err) {
    console.error('getOptions error', err.response?.data || err.message);
    return { workshops: [], serviceTypes: [], repairTypes: [] };
  }
};

// Add a new dropdown option (workshop / service type / repair type) explicitly,
// e.g. when the user opens the "Add Workshop" mini-modal from the page form.
const addOption = async (token, category, value) => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/maintenance/options`,
      { category, value },
      { headers: { ...authHeader(token), 'Content-Type': 'application/json' } },
    );
    return res.data?.data || { category, value };
  } catch (err) {
    console.error('addOption error', err.response?.data || err.message);
    throw err.response?.data || { detail: 'Failed to add option' };
  }
};

const deleteAttachment = async (token, id, fileKey) => {
  try {
    const res = await axios.delete(
      `${API_BASE_URL}/api/maintenance/${id}/attachments/${encodeURIComponent(fileKey)}`,
      { headers: authHeader(token) },
    );
    return res.data;
  } catch (err) {
    console.error('deleteAttachment error', err.response?.data || err.message);
    throw err.response?.data || { detail: 'Failed to delete attachment' };
  }
};

export const MaintenanceService = {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  deleteAttachment,
  getOptions,
  addOption,
  getAlerts,
};
