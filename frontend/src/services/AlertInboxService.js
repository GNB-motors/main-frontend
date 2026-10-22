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
  return response.data?.data ?? { items: [], openCount: 0, byCondition: {}, sources: {} };
}

export async function acknowledgeItem(id) {
  const response = await apiClient.put(`/api/alert-inbox/${id}/ack`);
  return response.data?.data ?? null;
}

export async function acknowledgeAll() {
  const response = await apiClient.put('/api/alert-inbox/ack-all');
  return response.data?.data ?? null;
}