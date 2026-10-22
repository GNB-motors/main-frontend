/**
 * Tolls API client.
 *
 * Thin wrapper over the configured axios instance, matching ReportsService's
 * shape: unwrap `{ status, data }`, re-throw as ApiError so pages can toast
 * `err.message`, and let cancellations propagate untouched.
 */
import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';

/** Backend answers 404 when the org's `tolls` flag is off. Say so plainly. */
const isFeatureOff = (error) => error?.response?.status === 404;

const FEATURE_OFF_MESSAGE = 'Tolls is not enabled for your organization';

async function get(path, params, signal) {
  try {
    const response = await apiClient.get(path, { params, signal });
    return response.data?.data ?? response.data ?? null;
  } catch (error) {
    if (error?.name === 'CanceledError') throw error;
    if (isFeatureOff(error)) throw new ApiError(FEATURE_OFF_MESSAGE, { status: 404 });
    throw ApiError.from(error);
  }
}

async function send(method, path, body) {
  try {
    const response = await apiClient.request({ method, url: path, data: body });
    return response.data?.data ?? response.data ?? null;
  } catch (error) {
    if (isFeatureOff(error)) throw new ApiError(FEATURE_OFF_MESSAGE, { status: 404 });
    throw ApiError.from(error);
  }
}

export const TollsService = {
  /** Monthly report: summary tiles, per-vehicle rows, plaza breakdown, anomalies. */
  getReport: (month, signal) => get('api/tolls/report', month ? { month } : {}, signal),

  /** Return-rule savers and the never-qualifying repeaters, plus a per-driver rollup. */
  getRanking: (month, signal) => get('api/tolls/ranking', month ? { month } : {}, signal),

  /** Crossings billed onward although a return was inside the plaza's window. */
  getAnomalies: (month, signal) => get('api/tolls/anomalies', month ? { month } : {}, signal),

  /** Raw crossings, org-scoped and paginated. */
  getCrossings: (params, signal) => get('api/tolls/crossings', params, signal),

  // ─── Plaza master ────────────────────────────────────────────────────────────

  /** Global plazas plus this org's own. `scope: 'own'` drops the global ones. */
  listPlazas: (params = {}, signal) => get('api/tolls/plazas', params, signal),

  getPlaza: (id, signal) => get(`api/tolls/plazas/${id}`, {}, signal),

  createPlaza: (body) => send('post', 'api/tolls/plazas', body),

  updatePlaza: (id, body) => send('put', `api/tolls/plazas/${id}`, body),

  deletePlaza: (id) => send('delete', `api/tolls/plazas/${id}`),

  /** CSV upsert. Defaults to a dry run so a bad paste never writes. */
  bulkUploadPlazas: (csv, dryRun = true) =>
    send('post', 'api/tolls/plazas/bulk', { csv, dryRun }),

  /** CSV export of the report — one row per vehicle × plaza. */
  exportCsv: async (month) => {
    try {
      const response = await apiClient.get('api/tolls/export', {
        params: month ? { month } : {},
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      const data = error.response?.data;
      let body = null;
      if (data instanceof Blob) {
        try {
          body = JSON.parse(await data.text());
        } catch {
          // Not a JSON body; the transport error below still says what failed.
        }
      }
      if (body) {
        throw new ApiError(body.message || body.detail || 'Export failed', {
          status: error.response?.status ?? null,
        });
      }
      if (isFeatureOff(error)) throw new ApiError(FEATURE_OFF_MESSAGE, { status: 404 });
      throw ApiError.from(error);
    }
  },
};

export default TollsService;