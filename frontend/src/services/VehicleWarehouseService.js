/**
 * VehicleWarehouse API client — declared, geofenced yards that vehicles are based at.
 *
 * Not to be confused with `/api/warehouse` (singular), which is the backend's
 * ClickHouse data-warehouse reconciliation module. These are physical yards, and
 * they are the anchors for warehouse-to-warehouse trip start/end detection
 * (backend docs/vehicle-warehouse-plan.md).
 *
 * Uses the shared apiClient so every call inherits Authorization + X-Org-Id.
 */
import apiClient from '../utils/axiosConfig';

const BASE = '/api/vehicle-warehouses';
const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

export const VehicleWarehouseService = {
  async list(params = {}) {
    const data = await apiClient.get(BASE, { params }).then(unwrap);
    // The backend pages this; callers only ever want the rows plus the total.
    return { warehouses: data?.warehouses ?? [], total: data?.total ?? 0 };
  },

  async get(id) {
    return apiClient.get(`${BASE}/${id}`).then(unwrap);
  },

  async create(payload) {
    return apiClient.post(BASE, payload).then(unwrap);
  },

  async update(id, payload) {
    return apiClient.patch(`${BASE}/${id}`, payload).then(unwrap);
  },

  async deactivate(id) {
    return apiClient.delete(`${BASE}/${id}`).then(unwrap);
  },

  async assignVehicles(id, vehicleIds) {
    return apiClient.post(`${BASE}/${id}/vehicles`, { vehicleIds }).then(unwrap);
  },

  async unassignVehicle(id, vehicleId) {
    return apiClient.delete(`${BASE}/${id}/vehicles/${vehicleId}`).then(unwrap);
  },

  /** Who is physically inside the yard right now (from VehicleZoneState). */
  async liveRoster(id) {
    return apiClient.get(`${BASE}/${id}/live`).then(unwrap);
  },
};

export default VehicleWarehouseService;
