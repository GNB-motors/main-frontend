import { useCallback, useEffect, useState } from 'react';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';

/**
 * useTrackReviewQueue — the places the fleet has not answered for yet.
 *
 * The queue is only asked for when the owner turns the layer on; it costs a
 * request and most days it is empty.
 */
export default function useTrackReviewQueue({ enabled = false, limit = 100 } = {}) {
  const [state, setState] = useState({ items: [], loading: false, error: null, loaded: false });

  const load = useCallback(async () => {
    if (!enabled) return;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await PlaceIntelligenceService.reviewQueue({ limit });
      const items = Array.isArray(data?.items) ? data.items : [];
      setState({ items, loading: false, error: null, loaded: true });
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
    count: state.error ? null : state.items.length,
    isLoading: state.loading,
    error: state.error,
    loaded: state.loaded,
    reload: load,
  };
}
