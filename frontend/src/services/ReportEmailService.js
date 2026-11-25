/**
 * Report e-mail API client.
 *
 * Two ways to send a report:
 *  - the server builds the file (`sendServerReport`) and is given the same
 *    filters the on-screen download used;
 *  - the browser builds the file (`sendFile`) and uploads it as multipart.
 *
 * The backend is not merged yet: these endpoints are the agreed contract
 * (plan §21.2), mocked in the tests and reconciled against PR C before the
 * merge. Access is enforced by the backend — this client only sends.
 */
import apiClient, { REPORT_TIMEOUT } from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';
import { parseSafe } from '../schemas/validate.js';

const statusOf = (res) => res?.data?.data ?? null;

/** Validate the queued/sent status, but never fail the request over a drift. */
const parseStatus = (data) =>
  parseSafe(
    'reportEmailStatusSchema',
    () => import('../schemas/reportEmail.schema.js'),
    data,
  );

export const ReportEmailService = {
  /**
   * The server builds the file from `report` + `params` (the filters of the
   * download on screen) and mails it to `to`.
   */
  async sendServerReport({ report, params, to, note }) {
    try {
      const res = await apiClient.post('/api/report-email/send', {
        report,
        params,
        to,
        note: note || undefined,
      });
      return await parseStatus(statusOf(res));
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /**
   * The browser built the file; upload it. Axios leaves the Content-Type of a
   * FormData body to the browser, so the multipart boundary is set correctly.
   */
  async sendFile({ blob, filename, to, reportLabel, note }) {
    try {
      const form = new FormData();
      form.append('file', blob, filename);
      form.append('to', JSON.stringify(to));
      if (reportLabel) form.append('reportLabel', reportLabel);
      if (note) form.append('note', note);
      const res = await apiClient.post('/api/report-email/send-file', form, {
        timeout: REPORT_TIMEOUT,
      });
      return await parseStatus(statusOf(res));
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /** The delivery state of one queued e-mail. */
  async getStatus(id) {
    try {
      const res = await apiClient.get(`/api/report-email/${id}`);
      return await parseStatus(statusOf(res));
    } catch (error) {
      throw ApiError.from(error);
    }
  },
};

export default ReportEmailService;
