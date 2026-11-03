import apiClient from '../utils/axiosConfig';

/**
 * ETA service — the predictive arrival read.
 *
 * `GET /api/eta/known` is the known-destination board: one row per truck whose
 * destination we actually know (a Trip Plan drop, a SAP dispatch), with the
 * p10/p50/p90 arrivals for it.
 *
 * The endpoint may not be deployed yet (404) or may not be open to this role
 * (403). Both of those mean "no known destinations", never "an error to shout
 * about": a surface that has nothing to show simply shows nothing.
 */
export async function getKnownEtas({ signal } = {}) {
  try {
    const response = await apiClient.get('/api/eta/known', { signal });
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error?.name === 'CanceledError') throw error;
    const status = error?.response?.status ?? error?.status;
    if (status === 404 || status === 403) return [];
    throw error;
  }
}

export default { getKnownEtas };
