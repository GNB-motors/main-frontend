import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';
import { parseSafe } from '../../schemas/validate';

const BASE = '/api/support-tickets';
// Up to 5 × 10 MB attachments; the default 30 s budget is for JSON reads.
const UPLOAD_TIMEOUT = 120000;
const MULTIPART = { 'Content-Type': 'multipart/form-data' };

const schemas = () => import('../../schemas/supportTicket.schema.js');

const call = async (request) => {
  try {
    return (await request).data?.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

const asTicket = async (request) => parseSafe('supportTicketSchema', schemas, await call(request));

/** { items, pagination } for the org's tickets. */
const list = async (params, { signal } = {}) =>
  parseSafe(
    'supportTicketListSchema',
    schemas,
    await call(apiClient.get(BASE, { params, signal })),
  );

/** { open, awaitingCustomer, solved, all, purgeAfterDays } */
const summary = async (params, { signal } = {}) =>
  parseSafe(
    'supportSummarySchema',
    schemas,
    await call(apiClient.get(`${BASE}/summary`, { params, signal })),
  );

const unreadCount = async ({ signal } = {}) =>
  (await call(apiClient.get(`${BASE}/unread-count`, { signal })))?.count ?? 0;

/** [{ userId, name }] — everyone in the org who has raised a ticket. */
const requesters = async ({ signal } = {}) =>
  (await call(apiClient.get(`${BASE}/requesters`, { signal }))) ?? [];

const get = (id, { signal } = {}) => asTicket(apiClient.get(`${BASE}/${id}`, { signal }));

const create = (form, { signal } = {}) =>
  asTicket(apiClient.post(BASE, form, { signal, headers: MULTIPART, timeout: UPLOAD_TIMEOUT }));

const reply = ({ id, form }, { signal } = {}) =>
  asTicket(
    apiClient.post(`${BASE}/${id}/messages`, form, {
      signal,
      headers: MULTIPART,
      timeout: UPLOAD_TIMEOUT,
    }),
  );

const solve = (id, { signal } = {}) =>
  asTicket(apiClient.post(`${BASE}/${id}/solve`, null, { signal }));

export const SupportService = { list, summary, unreadCount, requesters, get, create, reply, solve };
