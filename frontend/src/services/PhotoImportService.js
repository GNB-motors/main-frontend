/**
 * Photo import API client — bulk upload of the paper trail a truck carries:
 * register pages, fuel slips, pump displays, bills, odometer photos and the
 * driver's documents.
 *
 * The flow is deliberately two steps. The upload only starts a batch; the
 * batch is then read while the operator waits, and every photo comes back with
 * a plain reason if it has to be retaken. Nothing is decided here — the
 * driver's periods are a suggestion until a person confirms them.
 *
 * `uploadedAs` is optional and travels per file, so a photo the operator
 * believes is an odometer shot can say so and let the reader file it
 * correctly instead of guessing.
 *
 * Uses the shared apiClient so every call inherits Authorization + X-Org-Id.
 * Uploads get a budget beyond the 30 s default: a folder of photos is several
 * seconds per page and a person is waiting.
 */
import apiClient from '../utils/axiosConfig';

const unwrap = (res) => res.data?.data ?? res.data;

const UPLOAD_TIMEOUT = 200000;

const buildForm = ({ files = [], uploadedAs = {}, batchId } = {}) => {
  const form = new FormData();
  files.forEach((file) => form.append('files', file, file.name));
  const hints = Object.entries(uploadedAs || {})
    .filter(([, kind]) => kind)
    .map(([fileName, kind]) => ({ fileName, kind }));
  if (hints.length) form.append('uploadedAs', JSON.stringify(hints));
  if (batchId) form.append('batchId', batchId);
  return form;
};

const post = async (form, { signal } = {}) => {
  const response = await apiClient.post('/api/photo-imports', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_TIMEOUT,
    signal,
  });
  return unwrap(response);
};

const PhotoImportService = {
  /** Start a batch of photos. Resolves with { batchId }. */
  start: async ({ files = [], uploadedAs = {} } = {}, { signal } = {}) =>
    post(buildForm({ files, uploadedAs }), { signal }),

  /**
   * Put one retaken photo back into the batch it came from. Same endpoint,
   * same multipart body — the batch id tells the reader where it belongs.
   */
  reupload: async ({ batchId, file, uploadedAs = {} } = {}, { signal } = {}) =>
    post(buildForm({ files: file ? [file] : [], uploadedAs, batchId }), { signal }),

  /** The batch so far: status, counts and one row per photo. */
  getBatch: async (batchId, { signal } = {}) => {
    const response = await apiClient.get(`/api/photo-imports/${batchId}`, { signal });
    return unwrap(response);
  },

  /** The driver periods the reader guessed from the photos. */
  getDriverPeriods: async (batchId, { signal } = {}) => {
    const response = await apiClient.get(`/api/photo-imports/${batchId}/driver-periods`, {
      signal,
    });
    const data = unwrap(response);
    return Array.isArray(data) ? data : [];
  },

  /** Confirm, reject or correct driver periods — one item at a time or all. */
  confirmDriverPeriods: async (batchId, payload, { signal } = {}) => {
    const response = await apiClient.post(
      `/api/photo-imports/${batchId}/driver-periods/confirm`,
      payload,
      { signal },
    );
    return unwrap(response);
  },

  /** Recent batches, newest first — used when the chart opens without one. */
  listBatches: async ({ signal } = {}) => {
    const response = await apiClient.get('/api/photo-imports', { signal });
    const data = unwrap(response);
    return Array.isArray(data) ? data : [];
  },

  /** Drivers that already exist, for "pick another driver". */
  listDrivers: async ({ signal } = {}) => {
    const response = await apiClient.get('/api/employees', {
      params: { role: 'DRIVER', limit: 500 },
      signal,
    });
    const data = unwrap(response);
    const rows = Array.isArray(data) ? data : data?.data || data?.records || [];
    return Array.isArray(rows) ? rows : [];
  },
};

export default PhotoImportService;
