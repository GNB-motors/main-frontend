import apiClient from '../utils/axiosConfig';

/** Our self-hosted road engine (ROAD_INTELLIGENCE plan Task P4.8). Never calls a third-party map API. */
const unwrap = (res) => res?.data?.data ?? null;
let statusPromise = null;

const RoadService = {
  /** Cached for the browser session; any failure means "engine off" (pages fall back to raw trails). */
  getEngineStatus: () => {
    if (!statusPromise) {
      statusPromise = apiClient
        .get('/api/road/engine-status')
        .then(unwrap)
        .then((d) => d || { enabled: false })
        .catch(() => ({ enabled: false }));
    }
    return statusPromise;
  },

  /** Road trail for one vehicle; from/to are ISO strings (window at most 8 days). */
  getRoadTrail: async (registrationNumber, { from, to } = {}, signal) =>
    unwrap(
      await apiClient.get(`/api/road/trail/${encodeURIComponent(registrationNumber)}`, {
        params: { from, to },
        signal,
      }),
    ),

  /** Road trail when the engine is on, else null. Errors also give null: a map must never break on it. */
  getRoadTrailIfEnabled: async (registrationNumber, window = {}, signal) => {
    try {
      const status = await RoadService.getEngineStatus();
      if (!status || !status.enabled) return null;
      return await RoadService.getRoadTrail(registrationNumber, window, signal);
    } catch {
      return null;
    }
  },

  getOsmGaps: async ({ limit } = {}, signal) =>
    unwrap(await apiClient.get('/api/road/osm-gaps', { params: { limit }, signal })),

  /**
   * Pooled congestion list at one IST hour of week (plan P5.6; maths R22). Published edges only; null when the
   * engine is off or on error — the tab shows its honest empty state instead.
   */
  getCongestion: async ({ how, limit } = {}, signal) =>
    unwrap(await apiClient.get('/api/road/congestion', { params: { how, limit }, signal })),

  /** Test hook: forget the cached engine status. */
  _resetStatus: () => {
    statusPromise = null;
  },
};

export default RoadService;
