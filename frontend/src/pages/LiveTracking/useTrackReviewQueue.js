import { useCallback, useEffect, useRef, useState } from 'react';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';

/**
 * useTrackReviewQueue — the places the fleet has not answered for yet.
 *
 * Load the queue when the Places view opens so its count is available before
 * the map layer is enabled. Map visibility is controlled separately.
 */
export default function useTrackReviewQueue({ enabled = false, limit = 100 } = {}) {
  const [state, setState] = useState({
    items: [],
    count: null,
    loading: false,
    error: null,
    loaded: false,
  });

  const requestId = useRef(0);
  const resolved = useRef(new Set());

  const load = useCallback(async () => {
    if (!enabled) return;
    const request = ++requestId.current;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await PlaceIntelligenceService.listSites({
        status: 'PROPOSED',
        evidence: 'ready',
        fields: 'list',
        limit,
      });
      if (request !== requestId.current) return;
      const records = Array.isArray(data?.records) ? data.records : [];
      const items = records
        .filter(
          (site) =>
            site.status === 'PROPOSED' &&
            !site.supersededBy &&
            !resolved.current.has(String(site._id)),
        )
        .map((site) => ({ site }));
      const excluded = records.length - items.length;
      const count = Math.max(
        0,
        (Number.isFinite(data?.total) ? data.total : records.length) - excluded,
      );
      setState({ items, count, loading: false, error: null, loaded: true });
    } catch (error) {
      if (request !== requestId.current) return;
      setState((prev) => ({ ...prev, loading: false, error, loaded: true }));
    }
  }, [enabled, limit]);

  useEffect(() => {
    if (enabled) load();
    return () => {
      requestId.current += 1;
    };
  }, [enabled, load]);

  return {
    items: state.items,
    // Unknown is never zero: a failed read has no count at all.
    count: state.error ? null : state.count,
    isLoading: state.loading,
    error: state.error,
    loaded: state.loaded,
    reload: load,
    resolve: (id) => {
      resolved.current.add(String(id));
      requestId.current += 1;
      setState((prev) => ({
        ...prev,
        loading: false,
        items: prev.items.filter((item) => String(item.site._id) !== String(id)),
        count:
          prev.count == null
            ? null
            : Math.max(
                0,
                prev.count -
                  (prev.items.some((item) => String(item.site._id) === String(id)) ? 1 : 0),
              ),
      }));
    },
  };
}
