import apiClient from '../utils/axiosConfig';

const unwrapList = (res) => {
  const data = res.data?.data ?? res.data ?? [];
  return Array.isArray(data) ? data : [];
};

const unwrap = (res) => res.data?.data ?? {};

/** Google encoded polyline (precision 5) → [[lat, lng], …]. */
function decodePolyline(encoded) {
  if (!encoded) return [];
  const out = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    out.push([lat / 1e5, lng / 1e5]);
  }
  return out;
}

/**
 * The profitability API names things for the ledger it computes from; the
 * views speak the design's vocabulary. Translate once, here, so no view has
 * to know both.
 */
function normaliseProfitability(data) {
  const routes = (data.routes || []).map((r) => {
    const avgRevenueInr = r.avgRevenuePerTripInr ?? 0;
    const avgCostInr = r.avgRunningCostPerTripInr ?? 0;
    const km = r.distanceKm || r.routeDistanceKm || 0;
    return {
      ...r,
      originCity: r.origin?.city || null,
      destCity: r.destination?.city || null,
      distanceKm: r.routeDistanceKm ?? r.distanceKm ?? null,
      avgRevenueInr,
      avgCostInr,
      avgMarginInr: avgRevenueInr - avgCostInr,
      revenuePerKm: km ? (r.revenueInr || 0) / km : 0,
      costPerKm: km ? (r.runningCostInr || 0) / km : 0,
      costBreakdown: (r.costBreakdown || []).map((s) => ({ ...s, key: s.slice })),
      path: decodePolyline(r.geometry?.encodedPolyline),
    };
  });

  return {
    ...data,
    routes,
    totals: {
      ...(data.totals || {}),
      costInr: data.totals?.runningCostInr ?? 0,
    },
  };
}

/**
 * Read API behind the Route Hub's five views. Everything here is an existing
 * backend route — the hub adds no storage of its own.
 */
const RouteHubService = {
  /**
   * ERP trips for one vehicle, newest first — the replay's trip picker.
   *
   * Degrades to [] rather than throwing: an org without the ERP module still gets a
   * working replay, it just picks by date range as before.
   */
  getTripsForVehicle: async (vehicleId, signal) => {
    if (!vehicleId) return [];
    try {
      const res = await apiClient.get('/api/erp/trips', {
        params: { vehicleId, limit: 50 },
        signal,
      });
      const rows = res.data?.data ?? [];
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  },

  /**
   * Warehouse anchors for an ERP trip — the GPS-proven yard exit and return.
   *
   * Returns null rather than throwing: the replay works without a trip context, it
   * just falls back to labelling the window edges honestly instead of claiming a
   * trip start it cannot prove.
   */
  getTripAnchors: async (erpTripId, signal) => {
    if (!erpTripId) return null;
    try {
      const res = await apiClient.get(`/api/erp/trips/${erpTripId}/anchors`, { signal });
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  },

  /** Vehicle picker rows: { _id, registrationNumber, model, … }. */
  getVehicles: async (signal) =>
    unwrapList(await apiClient.get('/api/vehicles', { params: { limit: 500 }, signal })),

  /**
   * Sustained overspeed for ONE vehicle. `durationSec`, not minutes.
   * Throws 422 when the window has no pings at all (missing data, which is
   * different from "no events").
   */
  getOverspeedEvents: async ({ vehicleId, from, to, speedKmh, durationSec }, signal) =>
    unwrap(
      await apiClient.get('/api/overspeed/events', {
        params: { vehicleId, from, to, speedKmh, durationSec },
        signal,
      }),
    ),

  /** Fleet-wide overspeed rollup: per-vehicle ranking rows + fleet totals. */
  getFleetOverspeed: async ({ from, to, speedKmh, durationSec }, signal) => {
    const data = unwrap(
      await apiClient.get('/api/overspeed/fleet', {
        params: { from, to, speedKmh, durationSec },
        signal,
      }),
    );
    return { ...data, totals: data.fleet || {} };
  },

  /** Ordered breadcrumb trail for the replay canvas. */
  getTrail: async (registrationNumber, { from, to, limit } = {}, signal) =>
    unwrap(
      await apiClient.get(
        `/api/livetracking/positions/${encodeURIComponent(registrationNumber)}/trail`,
        { params: { from, to, limit }, signal },
      ),
    ),

  /** Paginated route-deviation events (OPEN first). `limit` is capped at 100. */
  getDeviationEvents: async ({ vehicle, from, to, page, limit } = {}, signal) =>
    unwrap(
      await apiClient.get('/api/route-deviation/events', {
        params: {
          ...(vehicle ? { vehicle } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(page ? { page } : {}),
          limit: Math.min(limit || 100, 100),
        },
        signal,
      }),
    ),

  /** Mark one deviation event reviewed. */
  reviewDeviationEvent: async (id) =>
    unwrap(await apiClient.put(`/api/route-deviation/events/${id}/review`)),

  /** Learned corridors (Route Intelligence) — geometry + traversal stats. */
  getCorridors: async (params = {}, signal) =>
    unwrap(await apiClient.get('/api/route-intelligence/corridors', { params, signal })),

  /**
   * One learned corridor, for drawing a planned path against an actual one.
   * There is no /corridors/:id route, so this filters the (small) list.
   */
  getCorridor: async (id, signal) => {
    const data = unwrap(
      await apiClient.get('/api/route-intelligence/corridors', {
        params: { limit: 100 },
        signal,
      }),
    );
    const list = data.records || data.corridors || [];
    return list.find((c) => String(c._id) === String(id)) || null;
  },

  /**
   * Per-route commercial profitability (revenue vs. measured + assumed cost).
   * Takes `days` for convenience; the API itself wants an explicit window.
   */
  getRouteProfitability: async ({ days = 30, from, to, branchId } = {}, signal) => {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(toDate.getTime() - days * 86400000);
    return normaliseProfitability(
      unwrap(
        await apiClient.get('/api/route-profitability/routes', {
          params: {
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            ...(branchId ? { branchId } : {}),
          },
          signal,
        }),
      ),
    );
  },

  /** Fleet utilization rollup — distance covered, vehicles active. */
  getUtilization: async (params = {}, signal) =>
    unwrap(await apiClient.get('/api/owner-value/utilization', { params, signal })),
};

export default RouteHubService;
