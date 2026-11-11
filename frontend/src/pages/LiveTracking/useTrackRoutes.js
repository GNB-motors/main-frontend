import { useMemo } from 'react';
import useApi from '../../hooks/useApi.js';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';
import { decodeRoutes, drawableRoutes } from '../PlaceHub/model/routes.js';
import { decodePolyline6 } from '../../lib/polyline6.js';

const EMPTY = [];
const EMPTY_SITES = new Map();
export function trackRouteModel(data) {
  const model = decodeRoutes(data);
  const eligible = model.legs.filter((leg) => !leg.inPlant);
  const matched = eligible.flatMap((leg) => {
    if (!['DRIVEN', 'ENGINE'].includes(leg.path?.source)) return [];
    const segments = (leg.path?.overviewSegments || [])
      .map(decodePolyline6)
      .filter((path) => path.length > 1);
    return segments.length ? [{ ...leg, segments }] : [];
  });
  return {
    legs: eligible,
    lines: drawableRoutes(matched),
    sites: model.sites,
    unmatchedCount: eligible.length - matched.length,
  };
}

export function trackDeliveryModel(data) {
  const sites = new Map();
  const legs = (data?.rows || []).map((row) => {
    for (const [id, name, position] of [
      [row.fromSiteId, row.fromName, row.fromPosition],
      [row.toSiteId, row.toName, row.toPosition],
    ]) {
      sites.set(String(id), { _id: id, name, ...(position || {}) });
    }
    return {
      ...row,
      kind: 'delivery',
      traversals: row.n,
      stats: { km: row.km, minutes: row.minutes },
      path: row.path || { source: 'NONE', overviewSegments: [] },
    };
  });
  return trackRouteModel({ legs, sites: [...sites.values()] });
}

export async function loadDeliveryRoutes(signal) {
  const limit = 200;
  const read = (page) =>
    PlaceIntelligenceService.listDeliveryLegs({ page, limit, includeMap: true }, { signal });
  const first = await read(1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, Math.ceil(first.total / limit) - 1) }, (_, index) =>
      read(index + 2),
    ),
  );
  return { rows: [first, ...rest].flatMap((page) => page.rows || []) };
}

/** The delivery feed and movement feed keep separate IDs and abort on a mode change. */
export default function useTrackRoutes({ enabled = false, kind = 'movement' } = {}) {
  const q = useApi(
    (signal) =>
      kind === 'delivery'
        ? loadDeliveryRoutes(signal)
        : PlaceIntelligenceService.routesMap({}, { signal }),
    [kind],
    { enabled, scopeKey: kind },
  );
  const model = useMemo(
    () => (kind === 'delivery' ? trackDeliveryModel(q.data) : trackRouteModel(q.data)),
    [q.data, kind],
  );
  return {
    kind,
    legs: enabled ? model.legs : EMPTY,
    lines: enabled ? model.lines : EMPTY,
    sites: enabled ? model.sites : EMPTY_SITES,
    unmatchedCount: enabled && q.data ? model.unmatchedCount : null,
    isLoading: enabled && q.loading,
    error: enabled ? q.error : null,
    reload: q.refetch,
  };
}
