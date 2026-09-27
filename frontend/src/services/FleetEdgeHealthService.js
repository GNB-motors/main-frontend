import apiClient from '../utils/axiosConfig';
import { fleetEdgeHealthSchema, orgListSchema } from '../schemas/fleetEdgeHealth.schema';

/**
 * FleetEdgeHealthService — superadmin data-flow health audit APIs.
 * Org → vehicles → per-vehicle connection/token status + per-feed freshness
 * (backend `test` and, when configured, the sink `gnb_ingest` cluster).
 */
const get = async (path, schema, signal) => {
  try {
    const response = await apiClient.get(path, { signal });
    const data = response.data?.data;
    const parsed = schema.safeParse(data);
    // Fall back to raw data on drift so a schema mismatch never looks like an outage.
    return parsed.success ? parsed.data : data;
  } catch (error) {
    if (error?.code === 'ERR_CANCELED') throw error;
    throw error.response?.data || { detail: `Could not fetch ${path}.` };
  }
};

export const FleetEdgeHealthService = {
  /** All organisations (superadmin) for the list step. */
  listOrganizations: (signal) => get('/api/admin/organizations', orgListSchema, signal),

  /** One org's per-vehicle FleetEdge data-flow + connection health. */
  getOrgHealth: (orgId, signal) =>
    get(
      `/api/admin/organizations/${encodeURIComponent(orgId)}/fleetedge-health`,
      fleetEdgeHealthSchema,
      signal,
    ),
};

export default FleetEdgeHealthService;
