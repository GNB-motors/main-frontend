/**
 * GeofenceService.jsx
 *
 * Single source of truth for all geofence-related API calls.
 * Follows the same pattern as ReportsService.jsx (apiClient + try/catch).
 *
 * Covers:
 *   1. Geofence Zones   — confirmed Places sites + drawn zones, entry/exit alerts (GeofenceZonesPage)
 *   2. Fuel hotspots    — siphoning hotspots and the fuel drain map (GeofencePage)
 *   3. Live Locations   — vehicle positions from the live tracking feed
 */

import apiClient from '../utils/axiosConfig';

export const GeofenceService = {
  // ─── Zone API (GeofenceZonesPage) ────────────────────────────────────────

  getZones: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/geofence/zones', { params });
      return response.data || { zones: [], total: 0, page: 1, totalPages: 1 };
    } catch (error) {
      console.error('GeofenceService.getZones:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to load zones' };
    }
  },

  createZone: async (data) => {
    try {
      const response = await apiClient.post('/api/geofence/zones', data);
      return response.data;
    } catch (error) {
      console.error('GeofenceService.createZone:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to create zone' };
    }
  },

  updateZone: async (zoneId, data) => {
    try {
      const response = await apiClient.put(`/api/geofence/zones/${zoneId}`, data);
      return response.data;
    } catch (error) {
      console.error('GeofenceService.updateZone:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to update zone' };
    }
  },

  deleteZone: async (zoneId) => {
    try {
      await apiClient.delete(`/api/geofence/zones/${zoneId}`);
    } catch (error) {
      console.error('GeofenceService.deleteZone:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to delete zone' };
    }
  },

  // ─── Zone Alert API ───────────────────────────────────────────────────────

  getAlerts: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/geofence/zones/alerts', { params });
      return response.data || { alerts: [], total: 0, page: 1, totalPages: 1 };
    } catch (error) {
      console.error('GeofenceService.getAlerts:', error.response?.data || error.message);
      return { alerts: [], total: 0, page: 1, totalPages: 1 };
    }
  },

  getUnreadAlertCount: async () => {
    try {
      const response = await apiClient.get('/api/geofence/zones/alerts/unread-count');
      return response.data?.count || 0;
    } catch (error) {
      console.error('GeofenceService.getUnreadAlertCount:', error.response?.data || error.message);
      return 0;
    }
  },

  markAlertsRead: async (alertIds) => {
    try {
      await apiClient.put('/api/geofence/zones/alerts/read', { alertIds });
    } catch (error) {
      console.error('GeofenceService.markAlertsRead:', error.response?.data || error.message);
    }
  },

  markAllAlertsRead: async () => {
    try {
      const response = await apiClient.put('/api/geofence/zones/alerts/read', { all: true });
      return response.data;
    } catch (error) {
      console.error('GeofenceService.markAllAlertsRead:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to mark alerts read' };
    }
  },

  // ─── Live Locations ───────────────────────────────────────────────────────

  /**
   * GET /api/livetracking/positions — current live position of every vehicle in the org.
   */
  getLiveLocations: async () => {
    try {
      const posRes = await apiClient.get('/api/livetracking/positions');
      const records = posRes.data?.data?.records || posRes.data?.data || [];
      return Array.isArray(records) ? records : [];
    } catch (error) {
      console.error('GeofenceService.getLiveLocations:', error.message);
      return [];
    }
  },

  // ─── Fuel Risk Hotspots & Drain Map Integration ──────────────────────────

  /**
   * GET /api/geofence/drain-map (with fallback to /api/hotspots/map)
   * Fuel-drain hotspot map aggregating fuel drop events and suspicious stops.
   */
  getDrainMap: async ({ from, to, bbox, signal } = {}) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (bbox) params.bbox = bbox;
    try {
      const response = await apiClient.get('/api/geofence/drain-map', { params, signal });
      return response.data?.data ?? response.data ?? null;
    } catch {
      const response = await apiClient.get('/api/hotspots/map', { params, signal });
      return response.data?.data ?? response.data ?? null;
    }
  },

  /**
   * GET /api/hotspots
   * Returns org and shared fuel-risk hotspots.
   */
  getHotspots: async ({ signal } = {}) => {
    try {
      const response = await apiClient.get('/api/hotspots', { signal });
      return response.data?.data ?? response.data ?? [];
    } catch (error) {
      console.error('GeofenceService.getHotspots:', error.response?.data || error.message);
      return [];
    }
  },

  dismissHotspot: async (id, { signal } = {}) => {
    const response = await apiClient.put(`/api/hotspots/${id}`, { active: false }, { signal });
    return response.data?.data ?? null;
  },

  activateHotspot: async (id, { signal } = {}) => {
    const response = await apiClient.put(`/api/hotspots/${id}`, { active: true }, { signal });
    return response.data?.data ?? null;
  },

  provenanceOf: (hotspot) => {
    if (!hotspot) return 'unknown';
    if (hotspot.orgId === null || hotspot.orgId === undefined) return 'network';
    return hotspot.source === 'AUTO_LEARNED' ? 'own-learned' : 'own-manual';
  },
};
