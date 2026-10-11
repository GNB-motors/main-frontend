import apiClient from '../../../utils/axiosConfig';
import ApiError from '../../../errors/ApiError';

/**
 * Service functions for the LEMU observability super-admin screen.
 * All endpoints live under /api/lemu and are guarded by SUPER_ADMIN.
 */
export const LemuService = {
  /**
   * Dashboard rollup for the header stats strip.
   */
  getDashboard: async () => {
    try {
      const response = await apiClient.get(`/api/lemu/dashboard`);
      return response.data || {};
    } catch (error) {
      console.error('API Error fetching LEMU dashboard:', error.response?.data || error.message);
      throw ApiError.from(error);
    }
  },

  /**
   * Cron/job heartbeat health panel.
   */
  getJobs: async () => {
    try {
      const response = await apiClient.get(`/api/lemu/jobs`);
      return response.data || {};
    } catch (error) {
      console.error('API Error fetching LEMU jobs:', error.response?.data || error.message);
      throw ApiError.from(error);
    }
  },

  /**
   * Job KPIs over a window, from the jobruns history (SUPER_ADMIN).
   * @param {number} hours - window, 1..720 (default 168)
   */
  getJobKpis: async (hours = 168) => {
    try {
      const response = await apiClient.get(`/api/lemu/jobs/kpis`, { params: { hours } });
      return response.data || {};
    } catch (error) {
      throw ApiError.from(error);
    }
  },

  /**
   * Paginated event explorer feed.
   * @param {object} params - { severity, layer, source, service, search, since, until, page, limit }
   */
  getEvents: async (params = {}) => {
    try {
      const response = await apiClient.get(`/api/lemu/events`, { params });
      return response.data || {};
    } catch (error) {
      console.error('API Error fetching LEMU events:', error.response?.data || error.message);
      throw ApiError.from(error);
    }
  },

  /**
   * Error tracker inbox.
   * @param {object} params - { resolved } ('true' | 'false' | undefined for all)
   */
  getErrorTrackers: async (params = {}) => {
    try {
      const response = await apiClient.get(`/api/lemu/errors`, { params });
      return response.data || {};
    } catch (error) {
      console.error(
        'API Error fetching LEMU error trackers:',
        error.response?.data || error.message,
      );
      throw ApiError.from(error);
    }
  },

  /**
   * Resolve an error tracker by fingerprint.
   * @param {string} fingerprint
   * @param {object} body - { resolvedBy?, notes? }
   */
  resolveError: async (fingerprint, body = {}) => {
    try {
      const response = await apiClient.post(
        `/api/lemu/errors/${encodeURIComponent(fingerprint)}/resolve`,
        body,
      );
      return response.data || {};
    } catch (error) {
      console.error(
        'API Error resolving LEMU error tracker:',
        error.response?.data || error.message,
      );
      throw ApiError.from(error);
    }
  },

  /**
   * Latest structural manifest for the System map.
   */
  getManifest: async () => {
    try {
      const response = await apiClient.get(`/api/lemu/manifest`);
      return response.data || {};
    } catch (error) {
      console.error('API Error fetching LEMU manifest:', error.response?.data || error.message);
      throw ApiError.from(error);
    }
  },

  /**
   * Version history for the Change feed.
   * @param {object} params - { page, limit }
   */
  getManifests: async (params = {}) => {
    try {
      const response = await apiClient.get(`/api/lemu/manifests`, { params });
      return response.data || {};
    } catch (error) {
      console.error('API Error fetching LEMU manifests:', error.response?.data || error.message);
      throw ApiError.from(error);
    }
  },

  /**
   * Per-minute pulse buckets for heat and status.
   * @param {object} params - { limit }
   */
  getPulse: async (params = {}) => {
    try {
      const response = await apiClient.get(`/api/lemu/pulse`, { params });
      return response.data || {};
    } catch (error) {
      console.error('API Error fetching LEMU pulse:', error.response?.data || error.message);
      throw ApiError.from(error);
    }
  },

  /**
   * Per-node liveness (last-seen per route/collection over a wide window), so
   * "quiet this hour" and "no signal all day" are distinguishable on the map.
   * @param {object} params - { windowHours }
   */
  getLiveness: async (params = {}) => {
    try {
      const response = await apiClient.get(`/api/lemu/liveness`, { params });
      return response.data || {};
    } catch (error) {
      console.error('API Error fetching LEMU liveness:', error.response?.data || error.message);
      throw ApiError.from(error);
    }
  },

  /**
   * Standing structural findings.
   */
  getFindings: async () => {
    try {
      const response = await apiClient.get(`/api/lemu/findings`);
      return response.data || {};
    } catch (error) {
      console.error('API Error fetching LEMU findings:', error.response?.data || error.message);
      throw ApiError.from(error);
    }
  },

  /**
   * Diff between a manifest version and its predecessor.
   * @param {number|string} version
   */
  getManifestDiff: async (version) => {
    try {
      const response = await apiClient.get(
        `/api/lemu/manifest/diff/${encodeURIComponent(version)}`,
      );
      return response.data || {};
    } catch (error) {
      console.error(
        'API Error fetching LEMU manifest diff:',
        error.response?.data || error.message,
      );
      throw ApiError.from(error);
    }
  },

  /**
   * Ask the backend to rebuild the structural manifest.
   */
  rebuildManifest: async () => {
    try {
      const response = await apiClient.post(`/api/lemu/manifest/rebuild`);
      return response.data || {};
    } catch (error) {
      console.error('API Error rebuilding LEMU manifest:', error.response?.data || error.message);
      throw ApiError.from(error);
    }
  },

  /**
   * Fuel-integrity lineage for a vehicle in a given time window.
   * @param {object} params - { registrationNumber, vehicleId, windowFrom, windowTo }
   */
  getFuelIntegrityLineage: async (params = {}) => {
    try {
      const response = await apiClient.get(`/api/lemu/lineage/fuel-integrity`, { params });
      return response.data || {};
    } catch (error) {
      console.error(
        'API Error fetching fuel-integrity lineage:',
        error.response?.data || error.message,
      );
      throw ApiError.from(error);
    }
  },

  /**
   * INFRA topology: hosts, stores, collections, tables, pipes, jobs —
   * structure from config, state from timestamped measurements.
   */
  getTopology: async () => {
    try {
      const response = await apiClient.get(`/api/lemu/topology`);
      return response.data || {};
    } catch (error) {
      console.error('API Error fetching LEMU topology:', error.response?.data || error.message);
      throw ApiError.from(error);
    }
  },

  /**
   * Errors joined to the functions that raised them. Each group carries an
   * explicit matchQuality ('exact' | 'file' | 'none'); 'none' groups attach
   * to no node and are listed under `unattributed`.
   * @param {object} params - { windowHours }
   */
  getErrorAttribution: async (params = {}) => {
    try {
      const response = await apiClient.get(`/api/lemu/error-attribution`, { params });
      return response.data || {};
    } catch (error) {
      console.error(
        'API Error fetching LEMU error attribution:',
        error.response?.data || error.message,
      );
      throw ApiError.from(error);
    }
  },

  /**
   * ClickHouse warehouse freshness for mirrored collections.
   */
  getWarehouseFreshness: async () => {
    try {
      const response = await apiClient.get(`/api/lemu/warehouse-freshness`);
      return response.data || {};
    } catch (error) {
      console.error(
        'API Error fetching warehouse freshness:',
        error.response?.data || error.message,
      );
      throw ApiError.from(error);
    }
  },
};
