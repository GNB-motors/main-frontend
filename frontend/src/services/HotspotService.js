import apiClient from '../utils/axiosConfig';

/**
 * HotspotService — siphoning/theft hotspot list + review actions.
 * GET /api/hotspots returns the org's own hotspots AND system-wide shared
 * hotspots (orgId: null). Shared rows carry only aggregates (centroid,
 * incidentCount, lastIncidentAt) — never which org contributed an incident.
 * The UI must keep it that way: no endpoint returns per-org incident lists
 * for a shared hotspot, and none should be added.
 */
export async function listHotspots({ signal } = {}) {
  const response = await apiClient.get('/api/hotspots', { signal });
  return response.data?.data ?? [];
}

export async function dismissHotspot(id, { signal } = {}) {
  const response = await apiClient.put(`/api/hotspots/${id}`, { active: false }, { signal });
  return response.data?.data ?? null;
}

export async function activateHotspot(id, { signal } = {}) {
  const response = await apiClient.put(`/api/hotspots/${id}`, { active: true }, { signal });
  return response.data?.data ?? null;
}

/**
 * Pure: provenance label for a hotspot row. Shared rows are the network
 * moat — labelled as such, never attributed to any org.
 */
export function provenanceOf(hotspot) {
  if (!hotspot) return 'unknown';
  if (hotspot.orgId === null || hotspot.orgId === undefined) return 'network';
  return hotspot.source === 'AUTO_LEARNED' ? 'own-learned' : 'own-manual';
}
