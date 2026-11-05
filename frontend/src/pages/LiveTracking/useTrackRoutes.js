import { useCallback, useEffect, useState } from 'react';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';
import { decodeRoutes, drawableRoutes } from '../PlaceHub/model/routes.js';
import { decodePolyline6 } from '../../lib/polyline6.js';

const EMPTY = [];

export function trackRouteModel(data) {
  const model = decodeRoutes(data);
  const eligible = model.legs.filter((leg) => !leg.inPlant);
  const matched = eligible.flatMap((leg) => {
    if (!['DRIVEN', 'ENGINE'].includes(leg.path?.source)) return [];
    const segments = (leg.path?.overviewSegments || []).map(decodePolyline6).filter((path) => path.length > 1);
    return segments.length ? [{ ...leg, segments }] : [];
  });
  return { lines: drawableRoutes(matched), sites: model.sites, unmatchedCount: eligible.length - matched.length };
}

/**
 * useTrackRoutes — the routes the fleet runs.
 *
 * The same map Place Hub draws, read from the same endpoint and decoded with
 * the same model, so a route looks the same on both pages.
 */
export default function useTrackRoutes({ enabled = false } = {}) {
  const [state, setState] = useState({ lines: [], sites: new Map(), unmatchedCount: null, loading: false, error: null });

  const load = useCallback(async () => {
    if (!enabled) return;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await PlaceIntelligenceService.routesMap();
      setState({ ...trackRouteModel(data), loading: false, error: null });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error }));
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) load();
    // Layer switched off: drop the lines so the map clears at once, not on reload.
    else setState({ lines: [], sites: new Map(), unmatchedCount: null, loading: false, error: null });
  }, [enabled, load]);

  return {
    lines: enabled ? state.lines : EMPTY,
    sites: state.sites,
    unmatchedCount: state.unmatchedCount,
    isLoading: state.loading,
    error: state.error,
    reload: load,
  };
}
