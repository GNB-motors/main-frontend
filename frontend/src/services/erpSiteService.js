import apiClient from '../utils/axiosConfig';
import { parseSafe } from '../schemas/validate.js';

const BASE = '/api/places/erp-sites';
const schemas = () => import('../schemas/erpSite.schema.js');
const unwrap = (response) => response.data?.data ?? response.data;

/**
 * Exact pickup/drop points for delivery orders. Searching goes through
 * EntityPicker (components/Erp/entityLookup.service.js); this covers the writes.
 */
export const ErpSiteService = {
  /** Resolves to `{ site, existing }` — existing = a saved place already covers the pin. */
  declare: async (data, { signal } = {}) =>
    parseSafe(
      'erpSiteDeclareSchema',
      schemas,
      unwrap(await apiClient.post(BASE, data, { signal })),
    ),

  update: async (id, data, { signal } = {}) =>
    parseSafe(
      'erpSiteSchema',
      schemas,
      unwrap(await apiClient.patch(`${BASE}/${id}`, data, { signal })),
    ),
};

export default ErpSiteService;
