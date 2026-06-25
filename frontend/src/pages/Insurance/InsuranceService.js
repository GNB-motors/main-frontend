import apiClient from '../../utils/axiosConfig';

// Thin wrapper over the /api/insurance endpoints. auth + X-Org-Id are injected by
// axiosConfig. List calls return the full envelope ({ data, meta }); single-resource
// calls unwrap to `.data.data`.
const BASE = '/api/insurance';

export const InsuranceService = {
  // ---- Leads ----
  listLeads: (params = {}) => apiClient.get(`${BASE}/leads`, { params }).then((r) => r.data),
  leadSummary: () => apiClient.get(`${BASE}/leads/summary`).then((r) => r.data.data),
  listAgents: () => apiClient.get(`${BASE}/leads/agents`).then((r) => r.data.data),
  createLead: (body) => apiClient.post(`${BASE}/leads`, body).then((r) => r.data.data),
  bulkCreateLeads: (leads) => apiClient.post(`${BASE}/leads/bulk`, { leads }).then((r) => r.data.data),
  getLead: (id) => apiClient.get(`${BASE}/leads/${id}`).then((r) => r.data.data),
  updateLead: (id, body) => apiClient.patch(`${BASE}/leads/${id}`, body).then((r) => r.data.data),
  updateStatus: (id, body) => apiClient.patch(`${BASE}/leads/${id}/status`, body).then((r) => r.data.data),
  updatePriority: (id, priority) =>
    apiClient.patch(`${BASE}/leads/${id}/priority`, { priority }).then((r) => r.data.data),
  scheduleFollowUp: (id, body) =>
    apiClient.post(`${BASE}/leads/${id}/followup`, body).then((r) => r.data.data),
  addNote: (id, message) => apiClient.post(`${BASE}/leads/${id}/notes`, { message }).then((r) => r.data.data),
  deleteLead: (id) => apiClient.delete(`${BASE}/leads/${id}`).then((r) => r.data.data),

  // ---- Overview ----
  getOverview: (days = 30) =>
    apiClient.get(`${BASE}/overview`, { params: { days } }).then((r) => r.data.data),

  // ---- Communication ----
  getSettings: () => apiClient.get(`${BASE}/communication/settings`).then((r) => r.data.data),
  saveSettings: (body) => apiClient.put(`${BASE}/communication/settings`, body).then((r) => r.data.data),
  uploadLogo: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient
      .post(`${BASE}/communication/settings/logo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  },
  deleteLogo: () => apiClient.delete(`${BASE}/communication/settings/logo`).then((r) => r.data.data),
  listTemplates: () => apiClient.get(`${BASE}/communication/templates`).then((r) => r.data.data),
  getTemplate: (id) => apiClient.get(`${BASE}/communication/templates/${id}`).then((r) => r.data.data),
  createTemplate: (body) => apiClient.post(`${BASE}/communication/templates`, body).then((r) => r.data.data),
  updateTemplate: (id, body) =>
    apiClient.put(`${BASE}/communication/templates/${id}`, body).then((r) => r.data.data),
  deleteTemplate: (id) => apiClient.delete(`${BASE}/communication/templates/${id}`).then((r) => r.data.data),
};

export default InsuranceService;
