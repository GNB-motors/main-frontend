import apiClient from '../../../../utils/axiosConfig';
import ApiError from '../../../../errors/ApiError';

const BASE = '/api/admin/enquiries';

/** Fired on window after a status change so the sidebar badge re-counts. */
export const ENQUIRIES_CHANGED_EVENT = 'gnb:enquiries-changed';

const call = async (request) => {
  try {
    return (await request).data?.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

/** { items, pagination } */
const list = (params, { signal } = {}) => call(apiClient.get(BASE, { params, signal }));

/** { new, contacted, closed, all } */
const summary = (params, { signal } = {}) =>
  call(apiClient.get(`${BASE}/summary`, { params, signal }));

const newCount = async ({ signal } = {}) =>
  (await call(apiClient.get(`${BASE}/new-count`, { signal })))?.count ?? 0;

const updateStatus = async ({ id, status }) => {
  const enquiry = await call(apiClient.patch(`${BASE}/${id}`, { status }));
  window.dispatchEvent(new Event(ENQUIRIES_CHANGED_EVENT));
  return enquiry;
};

export const EnquiryAdminService = { list, summary, newCount, updateStatus };
