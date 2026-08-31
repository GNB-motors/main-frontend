import apiClient from '../../utils/axiosConfig';

/**
 * entityLookup.service — server-side typeahead for the ERP master entities.
 *
 * No new backend was needed: PartyService/VendorService/SupplierService already
 * implement `search` as a case-insensitive $or over name + code. This just wraps
 * them behind one shape so EntityPicker doesn't care which entity it's picking.
 *
 * FEATURE-FLAG HAZARD:
 * Masters are gated on `erpMasters` while the financial modules are gated on
 * `erpAccounts`, and requireFeature deliberately returns 404 rather than 403 so
 * a disabled module looks absent. An org with accounts but not masters therefore
 * gets a 404 here — which, if swallowed, is indistinguishable from "no matches".
 * We surface it as `err.moduleUnavailable` so the picker can degrade to a plain
 * ID input instead of showing an empty dropdown forever.
 */

const CONFIG = {
  PARTY: {
    url: '/api/erp/masters/parties',
    label: 'party',
    map: (r) => ({ id: r._id, name: r.name, code: r.code, meta: r.gstin, status: r.status }),
  },
  VENDOR: {
    url: '/api/erp/masters/vendors',
    label: 'vendor',
    map: (r) => ({ id: r._id, name: r.name, code: r.code, meta: r.panNo, status: r.status }),
  },
  SUPPLIER: {
    url: '/api/erp/masters/suppliers',
    label: 'supplier',
    map: (r) => ({ id: r._id, name: r.name, code: r.code, meta: r.panNo, status: r.status }),
  },
  VEHICLE: {
    url: '/api/vehicles',
    label: 'vehicle',
    searchKey: 'search',
    map: (r) => ({
      id: r._id,
      name: r.registrationNumber || r.vehicleNumber || r.regNo,
      code: r.model || '',
      meta: r.vehicleType,
    }),
  },
  DRIVER: {
    url: '/api/drivers',
    label: 'driver',
    searchKey: 'search',
    map: (r) => ({ id: r._id, name: r.name || r.fullName, code: r.licenseNumber, meta: r.phone }),
  },
};

const cache = new Map();
const CACHE_TTL_MS = 60_000;

const unwrapRows = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  return [];
};

const decorate = (error) => {
  const status = error?.response?.status;
  const err = new Error(error?.response?.data?.message || error.message || 'Lookup failed');
  err.status = status;
  // 404 here means "module not enabled for this org", not "no such endpoint".
  err.moduleUnavailable = status === 404;
  return err;
};

export const ENTITY_LABELS = Object.fromEntries(
  Object.entries(CONFIG).map(([key, cfg]) => [key, cfg.label]),
);

export const searchEntities = async (type, query, { limit = 20, signal } = {}) => {
  const cfg = CONFIG[type];
  if (!cfg) throw new Error(`Unknown entity type: ${type}`);

  const key = `${type}:${query || ''}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.rows;

  try {
    const params = { limit };
    if (query) params[cfg.searchKey || 'search'] = query;
    const response = await apiClient.get(cfg.url, { params, signal });
    const rows = unwrapRows(response.data).map(cfg.map).filter((r) => r.id && r.name);
    cache.set(key, { rows, at: Date.now() });
    return rows;
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.name === 'AbortError') throw error;
    throw decorate(error);
  }
};

/** Resolve a stored id into a display label, for hydrating an existing value. */
export const getEntityById = async (type, id) => {
  const cfg = CONFIG[type];
  if (!cfg || !id) return null;
  try {
    const response = await apiClient.get(`${cfg.url}/${id}`);
    const payload = response.data?.data ?? response.data;
    return payload ? cfg.map(payload) : null;
  } catch {
    // A failed hydrate must not break the form — the picker falls back to
    // showing the raw id, which is still better than an empty box.
    return null;
  }
};

export default { searchEntities, getEntityById, ENTITY_LABELS };
