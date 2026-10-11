import apiClient from '../../utils/axiosConfig';
import VehicleWarehouseService from '../../services/VehicleWarehouseService.js';
import PlaceIntelligenceService from './intelligence/PlaceIntelligenceService.js';
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

  /**
   * Every confirmed site, the 200 busiest suggestions worth an answer (and how
   * many there are in all), the 200 busiest set aside as low evidence (and their
   * total), the latest places said not to exist, and the review queue's order —
   * it puts places trips turn around at first, so those are asked about first.
   */
  loadSites: async ({ signal } = {}) => {
    let proposedTotal = 0;
    let lowEvidenceTotal = 0;
    const result = await layer(async () => {
      const page = (status, evidence) => (n) =>
        PlaceIntelligenceService.listSites(
          { status, limit: 200, page: n, ...(evidence && { evidence }) },
          { signal },
        ).then((d) => ({
          rows: d?.records ?? [],
          total: d?.total || 0,
          totalPages: Math.ceil((d?.total || 0) / 200),
        }));
      const [confirmed, proposed, low, rejected, queue] = await Promise.all([
        allPages(page('CONFIRMED'), MAX_SITE_PAGES),
        page('PROPOSED')(1),
        // Optional: a backend without evidence=low answers 400, and that must not
        // take the other lists down with it (prod 2026-10-11, frontend deployed first).
        // One that ignores it sends To review again; those rows are dropped by id below.
        page(
          'PROPOSED',
          'low',
        )(1).catch((error) => {
          if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error;
          return { rows: [], total: 0 };
        }),
        page('REJECTED')(1),
        // The order is a nicety; the suggestions still list without it.
        PlaceIntelligenceService.reviewQueue({ limit: 100 }, { signal }).catch(() => null),
      ]);
      proposedTotal = proposed.total;
      const reviewIds = new Set(proposed.rows.map((s) => String(s._id)));
      const lowRows = low.rows
        .filter((s) => !reviewIds.has(String(s._id)))
        .map((s) => ({ ...s, lowEvidence: true }));
      lowEvidenceTotal = lowRows.length ? low.total : 0;
      const byId = new Map(
        [...confirmed.rows, ...proposed.rows, ...lowRows, ...rejected.rows].map((s) => [
          String(s._id),
          s,
        ]),
      );
      (queue?.items || []).forEach((item, rank) => {
        if (!item?.site?._id) return;
        const id = String(item.site._id);
        byId.set(id, {
          ...item.site,
          ...byId.get(id),
          tripDrops: item.tripDrops,
          reviewRank: rank,
        });
      });
      return [...byId.values()];
    });
    return { ...result, proposedTotal, lowEvidenceTotal };
  },

  /** The full record behind a detected place: evidence, facility, address. */
  siteDetail: (id, { signal } = {}) =>
    PlaceIntelligenceService.getSite(id, { signal }).then((d) => d?.site ?? null),

  /** Headline numbers: unexplained stop time, when the engine last ran. */
  loadSummary: ({ signal } = {}) => layer(() => PlaceIntelligenceService.summary({ signal })),

  /** Last week's stops nothing explains — not fuel, loading, rest rules or a queue. */
  loadBreaks: ({ signal } = {}) =>
    layer(
      async () =>
        (await PlaceIntelligenceService.listBreaks({ limit: 200 }, { signal }))?.records ?? [],
    ),

  /** Plants, pumps, sidings … the map data knows about inside a box. A database read. */
  loadPoi: (box, { signal } = {}) =>
    PlaceIntelligenceService.listPoi(box, { signal }).then((d) => d?.items || []),

  tagStop: (id, purpose) => PlaceIntelligenceService.tagStop({ id, purpose }),

  /** One site by id: a suggestion outside the 200 busiest that a link opens. */
  loadSite: async (id, { signal } = {}) => {
    const d = await PlaceIntelligenceService.getSite(id, { signal });
    return d?.site ?? null;
  },

  loadHotspots: ({ signal } = {}) => layer(() => listHotspots({ signal })),

  loadDrainMap: ({ signal } = {}) => layer(() => getDrainMap({ signal })),

  loadLiveIdling: ({ signal } = {}) => layer(() => IdlingConsoleService.getLive({ signal })),

  /** The org's idle threshold — the same value the idling endpoints filter by. */
  loadIdleSetting: ({ signal } = {}) =>
    apiClient
      .get('/api/fuel-settings', { signal })
      .then(unwrap)
      .catch(() => null),

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
