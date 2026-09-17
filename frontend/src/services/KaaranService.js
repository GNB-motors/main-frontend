/**
 * KaaranService.js
 *
 * Frontend service layer for Kaaran Intelligence endpoints:
 *   - Feature #10: Driver Improvement & Consistency Tracking (/api/kaaran/driver-trends)
 *   - Feature #9: Unknown Territory & Manager Learning Loop (/api/kaaran/territory)
 *   - Feature #7: Pump Short-Delivery Ledger (/api/kaaran/pumps)
 */

import apiClient from '../utils/axiosConfig';

export const KaaranService = {
  // ── Feature #10: Driver Improvement & Consistency ──
  getDriverTrends: async (params = {}) => {
    try {
      const res = await apiClient.get('/api/kaaran/driver-trends', { params });
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error('KaaranService.getDriverTrends error:', err);
      throw err.response?.data || { message: 'Failed to load driver trends' };
    }
  },

  getDriverTrend: async (driverId) => {
    try {
      const res = await apiClient.get(`/api/kaaran/driver-trends/${driverId}`);
      return res.data?.data || res.data;
    } catch (err) {
      console.error('KaaranService.getDriverTrend error:', err);
      throw err.response?.data || { message: 'Failed to load driver trend' };
    }
  },

  recomputeDriverTrends: async () => {
    try {
      const res = await apiClient.post('/api/kaaran/driver-trends/recompute');
      return res.data;
    } catch (err) {
      console.error('KaaranService.recomputeDriverTrends error:', err);
      throw err.response?.data || { message: 'Failed to recompute driver trends' };
    }
  },

  // ── Feature #9: Unknown Territory & Learning Loop ──
  getUnknownTerritories: async (params = {}) => {
    try {
      const res = await apiClient.get('/api/kaaran/territory', { params });
      const d = res.data?.data || res.data;
      if (Array.isArray(d)) return d;
      if (Array.isArray(d?.data)) return d.data;
      return [];
    } catch (err) {
      console.error('KaaranService.getUnknownTerritories error:', err);
      throw err.response?.data || { message: 'Failed to load unknown territories' };
    }
  },

  detectUnknownTerritories: async (lookbackHours = 72) => {
    try {
      const res = await apiClient.post('/api/kaaran/territory/detect', { lookbackHours });
      return res.data;
    } catch (err) {
      console.error('KaaranService.detectUnknownTerritories error:', err);
      throw err.response?.data || { message: 'Detection scan failed' };
    }
  },

  classifyTerritory: async (id, data) => {
    try {
      const res = await apiClient.post(`/api/kaaran/territory/${id}/classify`, data);
      return res.data;
    } catch (err) {
      console.error('KaaranService.classifyTerritory error:', err);
      throw err.response?.data || { message: 'Classification failed' };
    }
  },

  // ── Feature #7: Pump Short-Delivery Ledger ──
  getPumpSummary: async () => {
    try {
      const res = await apiClient.get('/api/kaaran/pumps/summary');
      return res.data?.data || res.data || {};
    } catch (err) {
      console.error('KaaranService.getPumpSummary error:', err);
      throw err.response?.data || { message: 'Failed to load pump summary' };
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
      throw err.response?.data || { message: 'Failed to load pump ledger' };
    }
  },

  getPumpHonesty: async (pumpId) => {
    try {
      const res = await apiClient.get(`/api/kaaran/pumps/${pumpId}/honesty`);
      return res.data?.data || res.data;
    } catch (err) {
      console.error('KaaranService.getPumpHonesty error:', err);
      throw err.response?.data || { message: 'Failed to load pump honesty' };
    }
  },
};

export default KaaranService;
