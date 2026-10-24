import apiClient from '../../utils/axiosConfig';

/**
 * Weather reads for the Live Tracking map + replay (backend `/api/weather`,
 * the `weathercells` reader). Weather is a non-critical overlay: a failed or
 * missing read must never break the map, so these resolve to a NO_ROW-shaped
 * object or null instead of throwing.
 *
 * Every OK payload carries `attribution` — the provider's credit (MET Norway /
 * Open-Meteo). The backend refuses to serve conditions without it; the UI must
 * show it next to any weather it renders.
 */
export const WeatherService = {
  /**
   * Weather at one point at one instant.
   * @param {number} lat
   * @param {number} lng
   * @param {Date|string|null} at - instant; defaults to now
   * @returns {Promise<object|null>} { state, conditions, attribution, ... } or null
   */
  getAt: async (lat, lng, at = null, { signal } = {}) => {
    try {
      const params = { lat, lng };
      if (at) params.at = at instanceof Date ? at.toISOString() : at;
      const res = await apiClient.get('/api/weather/at', { params, signal });
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * The hour-by-hour strip around an instant for one cell (replay timeline).
   * @returns {Promise<object|null>} { state, hours: [...], attribution, ... }
   */
  getStrip: async (lat, lng, at = null, { pastHours = 2, futureHours = 2, signal } = {}) => {
    try {
      const params = { lat, lng, pastHours, futureHours };
      if (at) params.at = at instanceof Date ? at.toISOString() : at;
      const res = await apiClient.get('/api/weather/strip', { params, signal });
      return res.data?.data || null;
    } catch {
      return null;
    }
  },
};
