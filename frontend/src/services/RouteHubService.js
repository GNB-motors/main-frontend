import apiClient from '../utils/axiosConfig';
import { getOrgId, getBranchId } from '../utils/session.js';
import { getVehicleList, detachOnAbort } from './vehicleListService';
import { parseSafe } from '../schemas/validate.js';

const unwrap = (res) => res.data?.data ?? {};
const deviationSchemas = () => import('../schemas/routeDeviation.schema.js');

// Overview and the Overspeed audit open on the same fleet window. Floored to
// the minute, both ask the same question, and the answer is shared for that
// minute instead of computed twice.
const FLEET_OVERSPEED_TTL_MS = 60 * 1000;
const fleetOverspeedCache = new Map();

const toMinute = (iso) => {
  const ms = new Date(iso).getTime();
  return iso && Number.isFinite(ms) ? new Date(Math.floor(ms / 60000) * 60000).toISOString() : iso;
};

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
  getVehicles: (signal) => getVehicleList({ signal }),

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
  getFleetOverspeed: ({ from, to, speedKmh, durationSec }, signal) => {
    const params = { from: toMinute(from), to: toMinute(to), speedKmh, durationSec };
    const key = JSON.stringify([getOrgId(), getBranchId(), params]);
    const now = Date.now();
    for (const [k, entry] of fleetOverspeedCache) {
      if (now - entry.at >= FLEET_OVERSPEED_TTL_MS) fleetOverspeedCache.delete(k);
    }
    let entry = fleetOverspeedCache.get(key);
    if (!entry) {
      const promise = apiClient.get('/api/overspeed/fleet', { params }).then((res) => {
        const data = unwrap(res);
        return { ...data, totals: data.fleet || {} };
      });
      promise.catch(() => {
        if (fleetOverspeedCache.get(key)?.promise === promise) fleetOverspeedCache.delete(key);
      });
      entry = { at: now, promise };
      fleetOverspeedCache.set(key, entry);
    }
    return detachOnAbort(entry.promise, signal);
  },

  /** Ordered breadcrumb trail for the replay canvas. */
  getTrail: async (registrationNumber, { from, to, limit } = {}, signal) =>
    unwrap(
      await apiClient.get(
        `/api/livetracking/positions/${encodeURIComponent(registrationNumber)}/trail`,
        { params: { from, to, limit }, signal },
      ),
    ),

  /**
   * Paginated route-deviation events (OPEN first). `limit` is capped at 100.
   * `summary` counts the whole filtered set; each record's `trip` names the
   * AutoTrip and leg (LADEN / RETURN) the detour happened on, or is null.
   */
  getDeviationEvents: async (
    { vehicle, from, to, status, leg, linked, autoTripId, minExtraKm, page, limit } = {},
    signal,
  ) =>
    parseSafe(
      'deviationListSchema',
      deviationSchemas,
      unwrap(
        await apiClient.get('/api/route-deviation/events', {
          params: {
            ...(vehicle ? { vehicle } : {}),
            ...(from ? { from } : {}),
            ...(to ? { to } : {}),
            ...(status ? { status } : {}),
            ...(leg ? { leg } : {}),
            ...(linked != null ? { linked } : {}),
            ...(autoTripId ? { autoTripId } : {}),
            ...(minExtraKm ? { minExtraKm } : {}),
            ...(page ? { page } : {}),
            limit: Math.min(limit || 100, 100),
          },
          signal,
        }),
      ),
    ),

  /**
   * One deviation with everything its map draws: the detour (exit, farthest
   * point, rejoin, path), the trip it happened on, the usual-route band and the
   * track over the whole trip.
   */
  getDeviationEvent: async (id, signal) =>
    parseSafe(
      'deviationDetailSchema',
      deviationSchemas,
      unwrap(await apiClient.get(`/api/route-deviation/events/${id}`, { signal })),
    ),

  /** Mark a deviation reviewed (optional reason + note), or reopen it with status OPEN. */
  reviewDeviationEvent: async ({ id, status = 'REVIEWED', reason, note }, { signal } = {}) =>
    unwrap(
      await apiClient.put(
        `/api/route-deviation/events/${id}/review`,
        { status, ...(reason ? { reason } : {}), ...(note ? { note } : {}) },
        { signal },
      ),
    ),

  /** Learned corridors (Route Intelligence) — geometry + traversal stats. */
  getCorridors: async (params = {}, signal) =>
    unwrap(await apiClient.get('/api/route-intelligence/corridors', { params, signal })),

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
