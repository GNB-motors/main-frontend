/**
 * KaaranService.js
 *
 * Frontend service layer for Kaaran Intelligence endpoints:
 *   - Feature #10: Driver Improvement & Consistency Tracking (/api/kaaran/driver-trends)
 *   - Feature #9: Unknown Territory & Manager Learning Loop (/api/kaaran/territory)
 *   - Feature #7: Pump Short-Delivery Ledger (/api/kaaran/pumps)
 */

import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';

export const KaaranService = {
  // ── Feature #10: Driver Improvement & Consistency ──
  getDriverTrends: async (params = {}) => {
    try {
      const res = await apiClient.get('/api/kaaran/driver-trends', { params });
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error('KaaranService.getDriverTrends error:', err);
      throw ApiError.from(err);
    }
  },

  getDriverTrend: async (driverId) => {
    try {
      const res = await apiClient.get(`/api/kaaran/driver-trends/${driverId}`);
      return res.data?.data || res.data;
    } catch (err) {
      console.error('KaaranService.getDriverTrend error:', err);
      throw ApiError.from(err);
    }
  },

  recomputeDriverTrends: async () => {
    try {
      const res = await apiClient.post('/api/kaaran/driver-trends/recompute');
      return res.data;
    } catch (err) {
      console.error('KaaranService.recomputeDriverTrends error:', err);
      throw ApiError.from(err);
    }
  },

  // ── Feature #9: Unknown Territory & Learning Loop ──
  // PI-DEPRECATED(M5): the four territory calls below go with UnknownTerritoryDrawer
  // (superseded by /places). Driver trends and the pump ledger stay.
  getUnknownTerritories: async (params = {}) => {
    try {
      const res = await apiClient.get('/api/kaaran/territory', { params });
      const d = res.data?.data || res.data;
      if (Array.isArray(d)) return d;
      if (Array.isArray(d?.data)) return d.data;
      return [];
    } catch (err) {
      console.error('KaaranService.getUnknownTerritories error:', err);
      throw ApiError.from(err);
    }
  },

  detectUnknownTerritories: async (lookbackHours = 72) => {
    try {
      const res = await apiClient.post('/api/kaaran/territory/detect', { lookbackHours });
      return res.data;
    } catch (err) {
      console.error('KaaranService.detectUnknownTerritories error:', err);
      throw ApiError.from(err);
    }
  },

  classifyTerritory: async (id, data) => {
    try {
      const res = await apiClient.post(`/api/kaaran/territory/${id}/classify`, data);
      return res.data;
    } catch (err) {
      console.error('KaaranService.classifyTerritory error:', err);
      throw ApiError.from(err);
    }
  },

  // ── Feature #7: Pump Short-Delivery Ledger ──
  getPumpSummary: async () => {
    try {
      const res = await apiClient.get('/api/kaaran/pumps/summary');
      return res.data?.data || res.data || {};
    } catch (err) {
      console.error('KaaranService.getPumpSummary error:', err);
      throw ApiError.from(err);
    }
  },

  getPumpLedger: async (params = {}) => {
    try {
      const res = await apiClient.get('/api/kaaran/pumps/ledger', { params });
      const d = res.data?.data || res.data;
      if (Array.isArray(d)) return d;
      if (Array.isArray(d?.pumps)) return d.pumps;
      return [];
    } catch (err) {
      console.error('KaaranService.getPumpLedger error:', err);
      throw ApiError.from(err);
    }
  },
};

export default KaaranService;
