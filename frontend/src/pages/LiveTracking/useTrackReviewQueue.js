import { useCallback, useEffect, useState } from 'react';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';

/**
 * useTrackReviewQueue — the places the fleet has not answered for yet.
 *
 * Load the queue when the Places view opens so its count is available before
 * the map layer is enabled. Map visibility is controlled separately.
 */
export default function useTrackReviewQueue({ enabled = false, limit = 100 } = {}) {
  const [state, setState] = useState({ items: [], count: null, loading: false, error: null, loaded: false });

  const load = useCallback(async () => {
    if (!enabled) return;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await PlaceIntelligenceService.reviewQueue({ limit });
      const items = Array.isArray(data?.items) ? data.items : [];
      const count = Number.isFinite(data?.total) ? data.total : items.length;
      setState({ items, count, loading: false, error: null, loaded: true });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error, loaded: true }));
    }
  }, [enabled, limit]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return {
    items: state.items,
    // Unknown is never zero: a failed read has no count at all.
    count: state.error ? null : state.count,
    isLoading: state.loading,
    error: state.error,
    loaded: state.loaded,
    reload: load,
  };
}
