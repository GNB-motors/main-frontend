import { useCallback, useEffect, useState } from 'react';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';
import { decodeRoutes, drawableRoutes } from '../PlaceHub/model/routes.js';

/**
 * useTrackRoutes — the routes the fleet runs.
 *
 * The same map Place Hub draws, read from the same endpoint and decoded with
 * the same model, so a route looks the same on both pages.
 */
export default function useTrackRoutes({ enabled = false } = {}) {
  const [state, setState] = useState({ lines: [], sites: new Map(), loading: false, error: null });

  const load = useCallback(async () => {
    if (!enabled) return;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await PlaceIntelligenceService.routesMap();
      const model = decodeRoutes(data);
      setState({ lines: drawableRoutes(model.legs), sites: model.sites, loading: false, error: null });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error }));
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return {
    lines: state.lines,
    sites: state.sites,
    isLoading: state.loading,
    error: state.error,
    reload: load,
  };
}
