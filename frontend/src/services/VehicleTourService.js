/**
 * VehicleTour API client — the "main trip": one warehouse-to-warehouse cycle.
 *
 * A truck leaves its yard, runs however many ERP trips, and comes home. That whole
 * span is one tour; the ERP trips inside it are its side trips. An operator closing
 * their ERP trip does NOT close the tour — it stays open until the vehicle is back.
 */
import apiClient from '../utils/axiosConfig';

const BASE = '/api/vehicle-tours';
const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const VehicleTourService = {
  async list(params = {}) {
    const data = await apiClient.get(BASE, { params }).then(unwrap);
    return { tours: data?.tours ?? [], total: data?.total ?? 0 };
  },

  /** One cycle with its side trips and both yards resolved. */
  async get(id) {
    return apiClient.get(`${BASE}/${id}`).then(unwrap);
  },

  /** Recompute a closed cycle's distance and side-trip reconciliation. */
  async rollup(id) {
    return apiClient.post(`${BASE}/${id}/rollup`).then(unwrap);
  },

  /**
   * The vehicle has permanently moved to the yard this cycle ended at. Every later
   * cycle then measures from there.
   */
  async shiftHome(id) {
    return apiClient.post(`${BASE}/${id}/shift-home`).then(unwrap);
  },
};

export default VehicleTourService;
