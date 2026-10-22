import apiClient from '../utils/axiosConfig';

/**
 * UsageAnalyticsService — what this organization opens, and the cut that
 * follows (00_PLAN.md item 26.1).
 *
 * The numbers are per surface and per role. There is deliberately no call that
 * returns one row per person: usage here is about the software, and a
 * per-driver productivity table is a different product decision that item 26
 * does not ask for.
 */

/** One screen-open. Fire-and-forget; the server ignores paths it does not count. */
export async function recordView(path) {
  const response = await apiClient.post('/api/usage/view', { path });
  return response.data?.data ?? null;
}

/**
 * The org's own cut, plus a verdict for every path in `surfaces` — including
 * paths it has NEVER opened, which is the only way "never opened" is visible
 * at all (an unopened screen leaves no row behind).
 */
export async function getNavProfile({ surfaces = [], signal } = {}) {
  const params = {};
  if (surfaces.length) params.surfaces = surfaces.join(',');
  const response = await apiClient.get('/api/usage/nav-profile', { params, signal });
  return response.data?.data ?? null;
}

/** The Usage page: the same profile with the daily series behind it. */
export async function getUsageSummary({ signal } = {}) {
  const response = await apiClient.get('/api/usage/summary', { signal });
  return response.data?.data ?? null;
}