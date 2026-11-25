import apiClient from '../utils/axiosConfig';
import { parseSafe } from '../schemas/validate.js';

/**
 * HotspotService — siphoning/theft hotspot list + review actions.
 * GET /api/hotspots returns the org's own hotspots AND system-wide shared
 * hotspots (orgId: null). Shared rows carry only aggregates (centroid,
 * incidentCount, lastIncidentAt) — never which org contributed an incident.
 * The UI must keep it that way: no endpoint returns per-org incident lists
 * for a shared hotspot, and none should be added. (`getHotspotIncidents` on a
 * shared hotspot returns only the caller's OWN alerts, plus a count of the
 * rest; no other fleet's row ever leaves the server.)
 */
export async function listHotspots({ signal } = {}) {
  const response = await apiClient.get('/api/hotspots', { signal });
  return response.data?.data ?? [];
}

/**
 * Fuel-drain hotspot map (feature #8). Aggregates FleetEdge THEFT alerts +
 * GeofenceAnomaly stops into coordinate-grid buckets. Buckets carry
 * coordinates only — no address — so callers geocode a clicked cell on demand.
 * `from`/`to` are ISO strings; `bbox` is "minLng,minLat,maxLng,maxLat". All are
 * optional (the backend defaults the window and returns the whole fleet).
 */
export async function getDrainMap({ from, to, bbox, signal } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  if (bbox) params.bbox = bbox;
  const response = await apiClient.get('/api/hotspots/map', { params, signal });
  return response.data?.data ?? null;
}

/**
 * The incidents behind one hotspot: this org's fuel-theft and unauthorised-
 * refuel alerts inside its circle over the learning window, newest first.
 */
export async function getHotspotIncidents(id, { signal } = {}) {
  const response = await apiClient.get(`/api/hotspots/${id}/incidents`, { signal });
  return parseSafe(
    'hotspotIncidentsSchema',
    () => import('../schemas/hotspotIncidents.schema.js'),
    response.data?.data ?? null,
  );
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
