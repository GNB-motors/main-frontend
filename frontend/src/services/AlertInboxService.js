import apiClient from '../utils/axiosConfig';

/**
 * AlertInboxService — the one feed (00_PLAN.md item 26.5).
 *
 * This does not replace owner-alerts, fleet-alerts, hotspots or support
 * tickets. Each of those keeps its own screen; this is the same rows folded so
 * that one condition is one thing to do. Acknowledging here closes the item —
 * it never deletes the underlying alert.
 */
export async function getInbox({ status = 'OPEN', signal } = {}) {
  const response = await apiClient.get('/api/alert-inbox', { params: { status }, signal });
  const data = response.data?.data;
  if (!data || !Array.isArray(data.items)) {
    throw new Error('Could not read the inbox response. Please try again.');
  }
  return data;
}

export async function acknowledgeItem(id) {
  const response = await apiClient.put(`/api/alert-inbox/${id}/ack`);
  return response.data?.data ?? null;
}

export async function acknowledgeAll() {
  const response = await apiClient.put('/api/alert-inbox/ack-all');
  return response.data?.data ?? null;
}

/* ─── Incidents ───────────────────────────────────────────────────────────────
 * The dispatcher's board: what the drivers reported, who took it, who is going
 * to the truck and what finally happened. It is a different feed from the
 * inbox above — an incident is a lifecycle, not a condition — but it is read
 * from the same place a manager already sits.
 */

export async function getIncidents({ status, type, page = 1, limit = 20, signal } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  if (type) params.type = type;
  const response = await apiClient.get('/api/incidents', { params, signal });
  const data = response.data?.data;
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: data?.pagination ?? null,
  };
}

/** Headline counts for the same window as the list. */
export async function getIncidentSummary({ signal } = {}) {
  const response = await apiClient.get('/api/incidents/summary', { signal });
  return response.data?.data ?? null;
}

/** Take ownership of an incident. */
export async function acknowledgeIncident(id) {
  const response = await apiClient.put(`/api/incidents/${id}/acknowledgement`);
  return response.data?.data ?? null;
}

/** Name who is going to the truck. The name is required; the phone is not. */
export async function assignIncident(id, body) {
  const response = await apiClient.put(`/api/incidents/${id}/assignment`, body);
  return response.data?.data ?? null;
}

/** Close an incident with what happened. The note is required. */
export async function resolveIncident(id, body) {
  const response = await apiClient.put(`/api/incidents/${id}/resolution`, body);
  return response.data?.data ?? null;
}
