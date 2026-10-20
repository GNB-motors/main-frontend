import apiClient from '../../../../utils/axiosConfig';
import ApiError from '../../../../errors/ApiError';
import { parseSafe } from '../../../../schemas/validate';

const BASE = '/api/admin/support-tickets';
const UPLOAD_TIMEOUT = 120000;
const MULTIPART = { 'Content-Type': 'multipart/form-data' };

const schemas = () => import('../../../../schemas/supportTicket.schema.js');

const call = async (request) => {
  try {
    return (await request).data?.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

const asTicket = async (request) => parseSafe('supportTicketSchema', schemas, await call(request));

/** { items, pagination } across every org; rows carry org.companyName. */
const list = async (params, { signal } = {}) =>
  parseSafe(
    'supportTicketListSchema',
    schemas,
    await call(apiClient.get(BASE, { params, signal })),
  );

/** { open, awaitingCustomer, solved, unread, all } */
const summary = async (params, { signal } = {}) =>
  parseSafe(
    'supportSummarySchema',
    schemas,
    await call(apiClient.get(`${BASE}/summary`, { params, signal })),
  );

const byOrg = async (params, { signal } = {}) =>
  parseSafe(
    'supportByOrgSchema',
    schemas,
    (await call(apiClient.get(`${BASE}/by-org`, { params, signal }))) ?? [],
  );

const unreadCount = async ({ signal } = {}) =>
  (await call(apiClient.get(`${BASE}/unread-count`, { signal })))?.count ?? 0;

const get = (id, { signal } = {}) => asTicket(apiClient.get(`${BASE}/${id}`, { signal }));

const reply = ({ id, form }, { signal } = {}) =>
  asTicket(
    apiClient.post(`${BASE}/${id}/messages`, form, {
      signal,
      headers: MULTIPART,
      timeout: UPLOAD_TIMEOUT,
    }),
  );

/** { status?, priority? } */
const update = ({ id, changes }, { signal } = {}) =>
  asTicket(apiClient.patch(`${BASE}/${id}`, changes, { signal }));

const listOrganizations = async ({ signal } = {}) =>
  (await call(apiClient.get('/api/admin/organizations', { signal }))) ?? [];

export const SupportAdminService = {
  list,
  summary,
  byOrg,
  unreadCount,
  get,
  reply,
  update,
  listOrganizations,
};
