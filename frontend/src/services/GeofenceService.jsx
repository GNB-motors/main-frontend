/**
 * GeofenceService.jsx
 *
 * Single source of truth for all geofence-related API calls.
 * Follows the same pattern as ReportsService.jsx (apiClient + try/catch).
 *
 * Covers three sub-features:
 *   1. Geofence Anomalies  — fuel drop at suspicious stops (GeofencePage)
 *   2. Geofence Zones      — accident blackspots, parking, custom (GeofenceZonesPage)
 *   3. Live Locations      — vehicle positions from FleetEdge snapshots
 */

import apiClient from '../utils/axiosConfig';

export const GeofenceService = {
  // ─── Anomaly API (GeofencePage) ──────────────────────────────────────────

  getAnomalyLocations: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/geofence/locations', { params });
      return response.data || { locations: [], total: 0, page: 1, totalPages: 1 };
    } catch (error) {
      console.error('GeofenceService.getAnomalyLocations:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to load anomaly locations' };
    }
  },

  getAnomalyStats: async () => {
    try {
      const response = await apiClient.get('/api/geofence/stats');
      return response.data || { total: 0, high: 0, medium: 0, low: 0, resolved: 0 };
    } catch (error) {
      console.error('GeofenceService.getAnomalyStats:', error.response?.data || error.message);
      return { total: 0, high: 0, medium: 0, low: 0, resolved: 0 };
    }
  },

  resolveAnomalyLocation: async (locationId, resolutionNote = null) => {
    try {
      const response = await apiClient.put(`/api/geofence/locations/${locationId}/resolve`, {
        resolutionNote,
      });
      return response.data;
    } catch (error) {
      console.error(
        'GeofenceService.resolveAnomalyLocation:',
        error.response?.data || error.message,
      );
      throw error.response?.data || { message: 'Failed to resolve location' };
    }
  },

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
    }
  },

  // ─── Live Locations ───────────────────────────────────────────────────────

  /**
   * GET /api/geofence/live-locations with fallback to /api/livetracking/positions
   * Returns current active live telemetry for all vehicles in the org.
   */
  getLiveLocations: async () => {
    try {
      const response = await apiClient.get('/api/geofence/live-locations');
      const vehicles = response.data?.vehicles;
      if (Array.isArray(vehicles) && vehicles.length > 0) {
        return vehicles;
      }
    } catch (error) {
      console.warn('GeofenceService.getLiveLocations primary call error:', error.message);
    }

    // Direct fallback to livetracking positions endpoint which is verified in telemetry
    try {
      const posRes = await apiClient.get('/api/livetracking/positions');
      const records = posRes.data?.data?.records || posRes.data?.data || [];
      return Array.isArray(records) ? records : [];
    } catch (error) {
      console.error('GeofenceService.getLiveLocations fallback error:', error.message);
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
