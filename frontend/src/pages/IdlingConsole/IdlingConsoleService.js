import apiClient from '../../utils/axiosConfig';

const BASE = '/api/idling-console';

/**
 * Idling Console API client.
 *
 * Both endpoints are gated by the `idlingConsole` feature flag (dark-launch)
 * on the backend; when the flag is off the calls return 404, which the page
 * renders as a calm empty state rather than crashing.
 */
export const IdlingConsoleService = {
  /** Currently-open idle segments — durationMin/litres/rupees computed live. */
  getLive: async ({ signal } = {}) => {
    const response = await apiClient.get(`${BASE}/live`, { signal });
    return response.data?.data ?? [];
  },

  /** Paginated closed segments. */
  getHistory: async ({ from, to, page = 1, limit = 20 } = {}, { signal } = {}) => {
    const response = await apiClient.get(`${BASE}/history`, {
      params: { from, to, page, limit },
      signal,
    });
    return {
      data: response.data?.data ?? [],
      meta: response.data?.meta ?? { total: 0, page, limit, totalPages: 1 },
    };
  },
};

export default IdlingConsoleService;
