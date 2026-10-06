import apiClient from '../utils/axiosConfig';
import { parseSafe } from '../schemas/validate.js';

const BASE = '/api/movement-approvals';
const schemas = () => import('../schemas/movementApproval.schema.js');

const unwrap = (response) => response.data?.data ?? response.data;
const parsed = async (name, response) => parseSafe(name, schemas, unwrap(response));

/**
 * Movement Approvals API. Behind the `autoTrips` flag (OWNER/MANAGER). An
 * approval pre-authorises a vehicle/driver to visit a place (so a detour there
 * is not charged as a deviation). `placeSpec.kind: 'ANY'` is OWNER-only.
 */
export const MovementApprovalService = {
  list: async (params = {}, { signal } = {}) =>
    parsed('approvalListSchema', await apiClient.get(BASE, { params, signal })),

  get: async (id, { signal } = {}) =>
    parsed('approvalSchema', await apiClient.get(`${BASE}/${id}`, { signal })),

  create: async (body, { signal } = {}) => unwrap(await apiClient.post(BASE, body, { signal })),

  revoke: async ({ id }, { signal } = {}) =>
    unwrap(await apiClient.post(`${BASE}/${id}/revoke`, {}, { signal })),
};

export default MovementApprovalService;
