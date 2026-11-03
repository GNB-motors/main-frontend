import apiClient from '../../utils/axiosConfig';
import VehicleWarehouseService from '../../services/VehicleWarehouseService.js';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';

/* The stores Place Hub reads, asked for exactly what Track draws: every
   warehouse, the custom geofence zones and the confirmed sites. Each layer
   fails on its own, so a 403 on sites never hides the warehouses. */

const SITE_PAGE_SIZE = 200;
const MAX_SITE_PAGES = 5; // same cap as Place Hub

const isCancel = (e) => e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED';

async function layer(load) {
  try {
    return { rows: await load(), error: null };
  } catch (error) {
    if (isCancel(error)) throw error;
    return { rows: [], error };
  }
}

async function confirmedSites(signal) {
  const page = (n) =>
    PlaceIntelligenceService.listSites(
      { status: 'CONFIRMED', limit: SITE_PAGE_SIZE, page: n, fields: 'list' },
      { signal },
    );
  const first = await page(1);
  const total = first?.total || 0;
  const pages = Math.min(Math.ceil(total / SITE_PAGE_SIZE), MAX_SITE_PAGES);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) => page(i + 2)),
  );
  return {
    rows: [first, ...rest].flatMap((d) => d?.records ?? []),
    truncated: total > MAX_SITE_PAGES * SITE_PAGE_SIZE,
  };
}

const TrackPlacesService = {
  async load({ allowZones, allowSites, signal } = {}) {
    const none = { rows: [], error: null };
    const [warehouses, zones, sites] = await Promise.all([
      layer(async () => (await VehicleWarehouseService.list({ limit: 500 })).warehouses),
      allowZones
        ? layer(async () => {
            const res = await apiClient.get('/api/geofence/zones', {
              params: { zoneType: 'CUSTOM', limit: 500 },
              signal,
            });
            return res.data?.zones ?? [];
          })
        : none,
      allowSites ? layer(() => confirmedSites(signal)) : none,
    ]);
    return {
      warehouses: warehouses.rows,
      zones: zones.rows,
      sites: sites.rows?.rows ?? [],
      sitesTruncated: Boolean(sites.rows?.truncated),
      failed: [
        warehouses.error && 'warehouses',
        zones.error && 'zones',
        sites.error && 'sites',
      ].filter(Boolean),
    };
  },
};

export default TrackPlacesService;
