import apiClient from '../utils/axiosConfig';

const unwrap = (response) => response.data?.data ?? {};

/** Authenticated, tenant/branch-scoped historical reads; never a route planner. */
const NavigationService = {
  sessions: async ({ vehicleId, autoTripId, from, to } = {}, signal) =>
    unwrap(
      await apiClient.get('/api/navigation/sessions', {
        params: { vehicleId, autoTripId, from, to },
        signal,
      }),
    ),
  session: async (id, signal) =>
    unwrap(await apiClient.get(`/api/navigation/sessions/${encodeURIComponent(id)}`, { signal })),
  corridors: async (signal) => unwrap(await apiClient.get('/api/navigation/corridors', { signal })),
};

export default NavigationService;
