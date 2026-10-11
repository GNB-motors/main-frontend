import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

// Blank filters are dropped, as the old query-string builder did; axios omits undefined params.
const filterParams = ({ recordType, vehicleId, search }) => ({
  recordType: recordType || undefined,
  vehicleId: vehicleId || undefined,
  search: search || undefined,
});

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

const listRecords = async ({ recordType, vehicleId, search, page = 1, limit = 50 } = {}) => {
  try {
    const res = await apiClient.get('/api/maintenance', {
      params: { ...filterParams({ recordType, vehicleId, search }), page, limit },
    });
    return {
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      meta: res.data?.meta || { total: 0, page: 1, limit, totalPages: 1 },
    };
  } catch (err) {
    console.error('listRecords error', err.response?.data || err.message);
    throw ApiError.from(err);
  }
};

const createRecord = async (payload, attachments) => {
  try {
    const res = await apiClient.post(
      '/api/maintenance',
      buildFormData(payload, attachments),
      MULTIPART,
    );
    return res.data?.data || res.data;
  } catch (err) {
    console.error('createRecord error', err.response?.data || err.message);
    throw ApiError.from(err);
  }
};

const updateRecord = async (id, payload, attachments) => {
  try {
    const res = await apiClient.patch(
      `/api/maintenance/${id}`,
      buildFormData(payload, attachments),
      MULTIPART,
    );
    return res.data?.data || res.data;
  } catch (err) {
    console.error('updateRecord error', err.response?.data || err.message);
    throw ApiError.from(err);
  }
};

const deleteRecord = async (id) => {
  try {
    const res = await apiClient.delete(`/api/maintenance/${id}`);
    return res.data;
  } catch (err) {
    console.error('deleteRecord error', err.response?.data || err.message);
    throw ApiError.from(err);
  }
};

// System-generated alerts (no caching server-side; refetch to refresh).
const getAlerts = async () => {
  try {
    const res = await apiClient.get('/api/maintenance/alerts');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (err) {
    console.error('getAlerts error', err.response?.data || err.message);
    throw ApiError.from(err);
  }
};

// Mark an alert occurrence as resolved. `fingerprint` must be the value the
// alert carried in getAlerts()'s response — it pins the exact occurrence.
const resolveAlert = async (alertId, { fingerprint, resolutionNote } = {}) => {
  try {
    const res = await apiClient.put(
      `/api/maintenance/alerts/${encodeURIComponent(alertId)}/resolve`,
      { fingerprint, resolutionNote },
    );
    return res.data?.data;
  } catch (err) {
    console.error('resolveAlert error', err.response?.data || err.message);
    throw ApiError.from(err);
  }
};

// KPI summary aggregated across every matching record (not just one loaded
// page) — accepts the same filters as listRecords, minus pagination.
const getSummary = async ({ recordType, vehicleId, search } = {}) => {
  try {
    const res = await apiClient.get('/api/maintenance/summary', {
      params: filterParams({ recordType, vehicleId, search }),
    });
    return res.data?.data || { total: 0, totalAmount: 0, last30: 0 };
  } catch (err) {
    console.error('getSummary error', err.response?.data || err.message);
    throw ApiError.from(err);
  }
};

// Org's saved dropdown options. Workshop list starts empty; service/repair type
// lists are merged with frontend defaults inside the modal.
const getOptions = async () => {
  try {
    const res = await apiClient.get('/api/maintenance/options');
    return res.data?.data || { workshops: [], serviceTypes: [], repairTypes: [] };
  } catch (err) {
    console.error('getOptions error', err.response?.data || err.message);
    return { workshops: [], serviceTypes: [], repairTypes: [] };
  }
};

// Add a new dropdown option (workshop / service type / repair type) explicitly,
// e.g. when the user opens the "Add Workshop" mini-modal from the page form.
const addOption = async (category, value) => {
  try {
    const res = await apiClient.post('/api/maintenance/options', { category, value });
    return res.data?.data || { category, value };
  } catch (err) {
    console.error('addOption error', err.response?.data || err.message);
    throw ApiError.from(err);
  }
};

export const MaintenanceService = {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  getOptions,
  addOption,
  getAlerts,
  resolveAlert,
  getSummary,
};
