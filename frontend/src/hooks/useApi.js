import { useState, useEffect, useCallback, useRef } from 'react';

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
 */
export function useApi(fetcher, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return controller;
  }, [enabled, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const controller = run();
    return () => controller?.abort();
  }, [run]);

  return { data, loading, error, refetch: run };
}

export default useApi;
