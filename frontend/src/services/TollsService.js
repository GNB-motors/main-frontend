/**
 * Tolls API client.
 *
 * Thin wrapper over the configured axios instance: unwrap `{ success, data }`,
 * re-throw as ApiError so pages can toast `err.message`, and let cancellations
 * propagate untouched.
 *
 * There is no feature flag here. Tolls is not a dark surface — it is what fills
 * the toll ledger, and a link that quietly vanished when a flag was off would be
 * the same kind of lie as a toll that vanished.
 */
import apiClient from '../utils/axiosConfig';
import ApiError from '../errors/ApiError';

async function get(path, params, signal) {
  try {
    const response = await apiClient.get(path, { params, signal });
    return response.data?.data ?? response.data ?? null;
  } catch (error) {
    if (error?.name === 'CanceledError') throw error;
    throw ApiError.from(error);
  }
}

async function send(method, path, body) {
  try {
    const response = await apiClient.request({ method, url: path, data: body });
    return response.data?.data ?? response.data ?? null;
  } catch (error) {
    throw ApiError.from(error);
  }
}

export const TollsService = {
  // ─── Plaza master ────────────────────────────────────────────────────────────
  /** Every plaza: its gate, whether OSM and this fleet agree on it, its review state. */
  listPlazas: (params = {}, signal) => get('api/tolls/plazas', params, signal),

  getPlaza: (code, signal) => get(`api/tolls/plazas/${encodeURIComponent(code)}`, {}, signal),

  /** Rate card, return rule, or a review decision. Anything a person owns. */
  updatePlaza: (code, body) => send('put', `api/tolls/plazas/${encodeURIComponent(code)}`, body),

  /** Re-read OSM booths, resolve gates, agree against the fleet, detect crossings. */
  sweep: () => send('post', 'api/tolls/plazas/sweep', {}),

  // ─── Crossings and the money ─────────────────────────────────────────────────
  /** Crossing rows, each labelled as an estimate or a driver bill. */
  getCrossings: (params = {}, signal) => get('api/tolls/crossings', params, signal),

  /** Estimate beside payment, per trip and plaza. Never blended. */
  getReconciliation: (params = {}, signal) => get('api/tolls/reconciliation', params, signal),

  /** Where a plaza's own return rule did not get applied to what was paid. */
  getReturnGaps: (params = {}, signal) => get('api/tolls/return-gaps', params, signal),

  /** Per-vehicle toll money, known and unknown apart. */
  getReport: (params = {}, signal) => get('api/tolls/report', params, signal),

  /** Per-driver toll spend and the extra against the lane's normal. */
  getRanking: (params = {}, signal) => get('api/tolls/ranking', params, signal),
};

export default TollsService;