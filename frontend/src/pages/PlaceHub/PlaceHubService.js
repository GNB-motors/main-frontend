import apiClient from '../../utils/axiosConfig';
import VehicleWarehouseService from '../../services/VehicleWarehouseService.js';
import PlaceIntelligenceService from '../PlaceIntelligence/PlaceIntelligenceService.js';
import { listHotspots, getDrainMap } from '../../services/HotspotService.js';
import IdlingConsoleService from '../IdlingConsole/IdlingConsoleService.js';

/**
 * Place Hub reads and writes through each store's existing API, so the page
 * works against today's backend with no new endpoints. Callers decide which
 * layers to load from the org's feature flags; a layer that still fails
 * (403 for a non-manager, 404 for a flag that just flipped) comes back empty
 * with its error instead of taking the whole page down.
 */

const MAX_SITE_PAGES = 5;
const MAX_IDLE_PAGES = 5;
const IDLE_PAGE_SIZE = 100;

const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

async function layer(load) {
  try {
    return { rows: await load(), error: null };
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error;
    return { rows: [], error };
  }
}

/** Page through a list endpoint until it runs out or the page cap is hit. */
async function allPages(fetchPage, maxPages) {
  const first = await fetchPage(1);
  const totalPages = Math.min(first.totalPages || 1, maxPages);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => fetchPage(i + 2)),
  );
  return {
    rows: [first, ...rest].flatMap((p) => p.rows),
    truncated: (first.totalPages || 1) > maxPages,
  };
}

export const PlaceHubService = {
  loadWarehouses: () =>
    layer(async () => (await VehicleWarehouseService.list({ limit: 500 })).warehouses),

  loadZones: ({ signal } = {}) =>
    layer(async () => {
      const res = await apiClient.get('/api/geofence/zones', {
        params: { zoneType: 'CUSTOM', limit: 500 },
        signal,
      });
      return res.data?.zones ?? [];
    }),

  /** Every confirmed site, plus the 200 busiest suggestions and how many there are in all. */
  loadSites: async ({ signal } = {}) => {
    let proposedTotal = 0;
    const result = await layer(async () => {
      const page = (status) => (n) =>
        PlaceIntelligenceService.listSites({ status, limit: 200, page: n }, { signal }).then(
          (d) => ({
            rows: d?.records ?? [],
            total: d?.total || 0,
            totalPages: Math.ceil((d?.total || 0) / 200),
          }),
        );
      const [confirmed, proposed] = await Promise.all([
        allPages(page('CONFIRMED'), MAX_SITE_PAGES),
        page('PROPOSED')(1),
      ]);
      proposedTotal = proposed.total;
      return [...confirmed.rows, ...proposed.rows];
    });
    return { ...result, proposedTotal };
  },

  loadHotspots: ({ signal } = {}) => layer(() => listHotspots({ signal })),

  loadDrainMap: ({ signal } = {}) => layer(() => getDrainMap({ signal })),

  loadLiveIdling: ({ signal } = {}) => layer(() => IdlingConsoleService.getLive({ signal })),

  /** Closed idle events for the last `days`, newest first, capped at 500. */
  loadIdleHistory: async ({ days = 7, signal } = {}) => {
    const from = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    let truncated = false;
    const result = await layer(async () => {
      const pages = await allPages(
        (n) =>
          IdlingConsoleService.getHistory(
            { from, page: n, limit: IDLE_PAGE_SIZE },
            { signal },
          ).then((d) => ({ rows: d.data, totalPages: d.meta?.totalPages })),
        MAX_IDLE_PAGES,
      );
      truncated = pages.truncated;
      return pages.rows;
    });
    return { ...result, truncated };
  },

  /** Who is physically inside a warehouse right now. */
  warehouseRoster: (id) => VehicleWarehouseService.liveRoster(id),

  /* ─── Writes, each to the store the place belongs to ─────────────────── */

  createWarehouse: (body) => VehicleWarehouseService.create(body),
  updateWarehouse: (id, body) => VehicleWarehouseService.update(id, body),
  deactivateWarehouse: (id) => VehicleWarehouseService.deactivate(id),

  createZone: (body) => apiClient.post('/api/geofence/zones', body).then(unwrap),
  updateZone: (id, body) => apiClient.put(`/api/geofence/zones/${id}`, body).then(unwrap),
  deleteZone: (id) => apiClient.delete(`/api/geofence/zones/${id}`).then(unwrap),

  createHotspot: (body) => apiClient.post('/api/hotspots', body).then(unwrap),
  updateHotspot: (id, body) => apiClient.put(`/api/hotspots/${id}`, body).then(unwrap),
};

export default PlaceHubService;
