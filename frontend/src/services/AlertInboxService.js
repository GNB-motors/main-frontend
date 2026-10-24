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
