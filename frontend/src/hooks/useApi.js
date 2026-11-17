import { useState, useEffect, useCallback, useRef } from 'react';
import apiMemo from '../utils/apiMemo';

/**
 * useApi — the house data-fetching primitive.
 *
 * const { data, loading, error, refetch } = useApi(
 *   (signal) => Service.getThing(params, { signal }),
 *   [JSON.stringify(params)]   // pass stable deps
 * );
 *
 * - abortable: in-flight request is cancelled on dep change/unmount
 * - keeps last good data while refetching (no flash-to-skeleton)
 * - error is the thrown payload (response.data) or a shaped fallback
 * - `cacheKey` + `cacheMs` (opt-in): an answer read under that key less than
 *   `cacheMs` ago is shown without a request (utils/apiMemo: per user, org and
 *   branch, this tab only). `refetch` always asks the server and refills it.
 */
export function useApi(
  fetcher,
  deps = [],
  { enabled = true, scopeKey = null, cacheKey = null, cacheMs = 0 } = {},
) {
  const cached = () =>
    enabled && cacheKey && cacheMs > 0 ? apiMemo.get(cacheKey, cacheMs) : undefined;
  const [data, setData] = useState(() => cached() ?? null);
  const [dataScope, setDataScope] = useState(scopeKey);
  const [loading, setLoading] = useState(() => enabled && cached() === undefined);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(
    (force = false) => {
      if (!enabled) return undefined;
      if (force !== true) {
        const hit = cached();
        if (hit !== undefined) {
          setData(hit);
          setDataScope(scopeKey);
          setError(null);
          setLoading(false);
          return undefined;
        }
      }
      const controller = new AbortController();
      setLoading(true);
      setError(null);
      fetcherRef
        .current(controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) {
            setData(result);
            setDataScope(scopeKey);
            if (cacheKey && cacheMs > 0) apiMemo.set(cacheKey, result);
          }
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
          setError(err);
          if (scopeKey !== dataScope) {
            setData(null);
            setDataScope(scopeKey);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return controller;
    },
    [enabled, scopeKey, cacheKey, cacheMs, ...deps],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const controller = run();
    return () => controller?.abort();
  }, [run]);
  // A manual refetch always asks the server.
  const refetch = useCallback(() => run(true), [run]);

  return {
    data: dataScope === scopeKey ? data : null,
    loading: !error && (loading || dataScope !== scopeKey),
    error,
    refetch,
  };
}

export default useApi;
