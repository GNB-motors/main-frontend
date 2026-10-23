import { useEffect, useState } from 'react';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService';
import { toPickOptions } from './placeSuggestions';

/**
 * usePlaceSuggestions — the ranked place list for the trip / schedule picker.
 *
 * The server ranks; this hook only debounces the typing so a scheduler is not
 * firing a request per keystroke, and shuts the request down when the dialog
 * closes. The map viewport is passed through when the caller has one — it is
 * the second ranking tier, so suggestions change as the person pans.
 *
 * `enabled` is false while the dialog is shut, which keeps a scheduler who
 * opens the trip list every morning from re-fetching on mount.
 */
export default function usePlaceSuggestions({
  enabled = false,
  q = '',
  viewport = null,
  role = null,
  includeLowConfidence = false,
  limit = 20,
  debounceMs = 250,
} = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stable key so the effect only re-runs when something the API cares about
  // actually changes.
  const key = JSON.stringify([q, viewport, role, includeLowConfidence, limit]);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      setError(null);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      PlaceIntelligenceService.suggestSites(
        { q, viewport, role, includeLowConfidence, limit },
        { signal: controller.signal },
      )
        .then((res) => {
          if (controller.signal.aborted) return;
          setData(res?.records || []);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
          // A picker that cannot reach the suggestions endpoint must still
          // work — fall back to an empty list and let the person type a name.
          setError(err);
          setData([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, q ? debounceMs : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, debounceMs]);

  return { suggestions: data, options: toPickOptions(data), loading, error };
}