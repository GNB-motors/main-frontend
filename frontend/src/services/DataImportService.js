/**
 * Data import API client — plan item 16.
 *
 * Two calls matter, and the difference between them is the whole point:
 *
 *   preview()  uploads the file and gets a report back. It writes nothing.
 *             Safe to press as often as you like.
 *   apply()    writes. It runs the SAME plan the preview showed and then saves,
 *             so the numbers on screen before you press the button are the
 *             numbers that land.
 *
 * Both send the file as multipart with `entity` plus the JSON-encoded `mapping`
 * and `resolvers`. The mapping is the operator's DECLARATION of which column is
 * the driver and how to match it — nothing is inferred from a header name here
 * or on the server, which is why the page makes you say it.
 *
 * Uses the shared apiClient so every call inherits Authorization + X-Org-Id.
 * Uploads get a budget beyond the 30 s default: a few thousand rows is several
 * queries and a person is waiting.
 */
import apiClient from '../utils/axiosConfig';

const unwrap = (res) => res.data?.data || res.data;

const UPLOAD_TIMEOUT = 200000;

const upload = (url, { file, entity, mapping, resolvers }) => {
  const form = new FormData();
  form.append('file', file);
  form.append('entity', entity);
  if (mapping) form.append('mapping', JSON.stringify(mapping));
  if (resolvers) form.append('resolvers', JSON.stringify(resolvers));
  return apiClient.post(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_TIMEOUT,
  });
};

const DataImportService = {
  /** Dry run. Computes everything and writes nothing. */
  preview: async (args) => unwrap(await upload('/api/data-imports/preview', args)),

  /** Explicit apply. Same plan as the preview, then written. */
  apply: async (args) => unwrap(await upload('/api/data-imports/apply', args)),

  /** Saved per-org mappings, each bound to one header row. */
  listMappings: async () => {
    const response = await apiClient.get('/api/data-imports/mappings');
    const data = unwrap(response);
    return Array.isArray(data) ? data : [];
  },

  saveMapping: async (entity, { headers, mapping, resolvers }) => {
    const response = await apiClient.put(`/api/data-imports/mappings/${entity}`, {
      headers,
      mapping,
      resolvers,
    });
    return unwrap(response);
  },

  /** Receipts for APPLIED imports. A dry run leaves no row, by design. */
  listRuns: async (params = {}) => {
    const response = await apiClient.get('/api/data-imports/runs', { params });
    return response.data;
  },
};

export default DataImportService;
