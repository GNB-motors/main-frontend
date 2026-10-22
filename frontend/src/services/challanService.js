/**
 * challanService — thin client for /api/challans (backend T5.4).
 *
 * Uses the shared `apiClient` (src/utils/axiosConfig) so the auth token,
 * org/branch headers and the normalized ApiError all come for free — the
 * same convention as every other service in this folder. The server scopes
 * every call by the token's orgId, so nothing here ever sends an org.
 *
 * There is deliberately NO CSV fetch here: the Challans page exports via
 * `components/ui/ExportButton` → `lib/exportTable`, the exporter every other
 * table in the app uses. One exporter, one column format.
 */
import apiClient from '../utils/axiosConfig';

export const CHALLAN_STATUSES = ['OPEN', 'PAID', 'DISPUTED', 'CANCELLED'];

/** Unwrap the backend envelope: { success, ...rest } or { success, data }. */
const body = (res) => res?.data;

/**
 * Paginated list + optional filter (vehicleNumber / vehicleId / status).
 * Returns { rows, total, page, limit }.
 */
export async function fetchChallans(params = {}) {
  const res = await apiClient.get('/api/challans', { params });
  return body(res)?.data || { rows: [], total: 0, page: 1, limit: 50 };
}

/** Open/paid totals for the KPI tile — whole org, not just the current page. */
export async function fetchChallanSummary(params = {}) {
  const res = await apiClient.get('/api/challans/summary', { params });
  return body(res)?.data;
}

/**
 * Per-vehicle roll-up: open/paid counts, open amount, and the age in days of
 * the oldest still-open challan for each plate.
 */
export async function fetchChallansPerVehicle() {
  const res = await apiClient.get('/api/challans/per-vehicle');
  return body(res)?.data || [];
}

/** Badge payload for the vehicle detail header: { count, oldestOpenDate, totalAmount }. */
export async function fetchOpenChallanBadge(vehicleNumber) {
  const res = await apiClient.get('/api/challans/badge', { params: { vehicleNumber } });
  return body(res)?.data || { count: 0, oldestOpenDate: null, totalAmount: 0 };
}

export async function createChallan(payload) {
  const res = await apiClient.post('/api/challans', payload);
  return body(res)?.data;
}

export async function updateChallan(id, payload) {
  const res = await apiClient.patch(`/api/challans/${id}`, payload);
  return body(res)?.data;
}

export async function deleteChallan(id) {
  await apiClient.delete(`/api/challans/${id}`);
}

/**
 * Ask the backend to pull one plate from the configured provider now.
 * Returns { providerName, fetched, rowsWritten, ... } so the UI can say
 * "3 new" or "provider not configured" without guessing.
 */
export async function syncChallansNow(plate, state) {
  const res = await apiClient.post('/api/challans/sync-now', { plate, state });
  return body(res)?.data;
}

/**
 * Age in whole days between the oldest open challan and now.
 * Returns null when there is nothing open or the date is unusable, so the
 * table renders "—" instead of "NaN days".
 */
export function oldestOpenAgeDays(oldestOpenDate) {
  if (!oldestOpenDate) return null;
  const d = oldestOpenDate instanceof Date ? oldestOpenDate : new Date(oldestOpenDate);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}
