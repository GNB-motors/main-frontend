import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';

/**
 * BD oil & DEF report API (GF).
 *
 * The backend answers with its standard envelope: the payload sits under
 * `data`, so every call unwraps it the same way the other report services do.
 *
 *   GET  /api/bd-reports?kind=OIL|DEF   → [{ _id, kind, day, fileName, rows, flagged, createdAt }]
 *   GET  /api/bd-reports/:id/download    → the xlsx blob
 *   POST /api/bd-reports/build           → { day, kind } (manager+ only)
 *
 * `day` is an IST calendar date ('YYYY-MM-DD'); counts that the backend does
 * not know stay null and are rendered as "—" by the screen, never as 0.
 */

/**
 * The roles the app already treats as manager+ (the same pair the backend
 * authorize() uses for manager-only endpoints). Only they see "Build now";
 * the backend stays the authority on who may build.
 */
export const BD_REPORT_MANAGER_ROLES = ['OWNER', 'MANAGER'];

/** The body of a response, whether the API wraps it in `data` or not. */
const bodyOf = (res) => {
  const payload = res?.data;
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
  return payload;
};

/**
 * The file name the server asked for, from the Content-Disposition header.
 * Handles both the plain `filename="x.xlsx"` and the RFC 5987
 * `filename*=UTF-8''x.xlsx` form. null when the header says nothing.
 */
export const filenameFromDisposition = (header) => {
  if (!header || typeof header !== 'string') return null;
  const utf8 = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  if (utf8) {
    const raw = utf8[1].trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
};

export const BdReportService = {
  /**
   * Every built report of one kind, newest first.
   * @param {'OIL'|'DEF'} kind
   * @returns {Promise<Array>}
   */
  list: async (kind, { signal } = {}) => {
    try {
      const response = await apiClient.get('/api/bd-reports', { params: { kind }, signal });
      const body = bodyOf(response);
      return Array.isArray(body) ? body : [];
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
    }
  },

  /**
   * The xlsx file of one report.
   * @param {string} id
   * @param {{ fallbackName?: string|null }} options fallbackName is the report's
   *   own fileName, used when the server sends no Content-Disposition.
   * @returns {Promise<{ blob: Blob, fileName: string|null }>}
   */
  download: async (id, { fallbackName = null, signal } = {}) => {
    try {
      const response = await apiClient.get(
        `/api/bd-reports/${encodeURIComponent(id)}/download`,
        { responseType: 'blob', signal },
      );
      const headers = response.headers || {};
      const disposition =
        headers['content-disposition'] || headers['Content-Disposition'] || null;
      return {
        blob: response.data,
        fileName: filenameFromDisposition(disposition) || fallbackName || null,
      };
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
    }
  },

  /**
   * Build (or rebuild) one day of one kind. The backend replaces the file of
   * an existing day/kind.
   * @param {{ day: string, kind: 'OIL'|'DEF' }} payload
   */
  build: async ({ day, kind }) => {
    try {
      const response = await apiClient.post('/api/bd-reports/build', { day, kind });
      const body = bodyOf(response);
      return body && typeof body === 'object' ? body : {};
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      throw ApiError.from(error);
    }
  },
};

export default BdReportService;
