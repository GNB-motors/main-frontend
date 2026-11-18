import { useState, useEffect, useCallback, useRef } from 'react';
import apiMemo from '../utils/apiMemo';

/**
 * One request per read, shared by everyone who asked for it at the same time.
 *
 * `key` is the caller's `dedupeKey`: the same string for the same read
 * (method + url + params). The first caller starts the request; the callers
 * that join while it is in flight get the same answer instead of their own
 * copy of the same call. The request is aborted only when every caller has
 * walked away, so one unmounting component cannot kill the read another one
 * is still waiting for.
 */
const inFlight = new Map(); // key -> { promise, controller, refs }

function release(entry) {
  entry.refs -= 1;
  if (entry.refs <= 0) entry.controller.abort();
}

/** Join (or start) the one request for `key`; hands back the shared promise. */
function joinRequest(key, factory, subscriberSignal) {
  let entry = inFlight.get(key);
  if (!entry) {
    const controller = new AbortController();
    entry = { controller, refs: 0, promise: null };
    entry.promise = Promise.resolve()
      .then(() => factory(controller.signal))
      .finally(() => {
        if (inFlight.get(key) === entry) inFlight.delete(key);
      });
    inFlight.set(key, entry);
  }
  entry.refs += 1;
  if (subscriberSignal) {
    if (subscriberSignal.aborted) release(entry);
    else subscriberSignal.addEventListener('abort', () => release(entry), { once: true });
  }
  return entry.promise;
}

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
 * - `dedupeKey` (opt-in): the same read asked for by several components at
 *   the same moment is one request. The key must describe the read itself
 *   (method + url + params), e.g. `vehicle-overview:ABC123`.
 */
export function useApi(
  fetcher,
  deps = [],
  { enabled = true, scopeKey = null, cacheKey = null, cacheMs = 0, dedupeKey = null } = {},
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
      // The same read asked for at the same time is one request, not N.
      const request = dedupeKey
        ? joinRequest(
            dedupeKey,
            (sharedSignal) => fetcherRef.current(sharedSignal),
            controller.signal,
          )
        : Promise.resolve(fetcherRef.current(controller.signal));
      request
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
    [enabled, scopeKey, cacheKey, cacheMs, dedupeKey, ...deps], // eslint-disable-line react-hooks/exhaustive-deps
  );

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
