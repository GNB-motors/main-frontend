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

function release(key, entry) {
  entry.refs -= 1;
  if (entry.refs <= 0) {
    // Drop it now: a caller arriving before the rejection lands must start fresh.
    if (inFlight.get(key) === entry) inFlight.delete(key);
    entry.controller.abort();
  }
}

/** Join (or start) the one request for `key`; hands back the shared promise. */
function joinRequest(key, factory, subscriberSignal) {
  let entry = inFlight.get(key);
  if (entry && entry.controller.signal.aborted) entry = null;
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
    if (subscriberSignal.aborted) release(key, entry);
    else subscriberSignal.addEventListener('abort', () => release(key, entry), { once: true });
  }
  return entry.promise;
}

/**
 * The shared in-flight registry, for a read that is not a useApi one.
 * The same read asked for at the same moment is one request; the request is
 * aborted only when every caller has walked away. `key` must describe the
 * read itself (method + url + params) — it is scoped to the session, so
 * another user, org or branch never joins it.
 */
export function dedupeRequest(key, factory, subscriberSignal) {
  return joinRequest(`${apiMemo.currentScope()}::${key}`, factory, subscriberSignal);
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
 *   the same time is one request. The key must describe the read itself
 *   (method + url + params), e.g. `vehicle-overview:ABC123`.
 */
export function useApi(
  fetcher,
  deps = [],
  { enabled = true, scopeKey = null, cacheKey = null, cacheMs = 0, dedupeKey = null } = {},
) {
  /**
   * The memo's answer for this read: `{ value, stale }`.
   *
   * An expired answer is handed out marked `stale` — the page shows it while
   * the read goes out again (stale-while-revalidate) instead of blanking.
   */
  const readCache = () => {
    if (!enabled || !cacheKey || cacheMs <= 0) return { value: undefined, stale: false };
    const hit = apiMemo.get(cacheKey, cacheMs);
    if (hit === undefined) return { value: undefined, stale: false };
    if (hit && hit.stale === true && 'data' in hit) return { value: hit.data, stale: true };
    return { value: hit, stale: false };
  };
  const [data, setData] = useState(() => readCache().value ?? null);
  const [dataScope, setDataScope] = useState(scopeKey);
  const [loading, setLoading] = useState(() => enabled && readCache().value === undefined);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(
    (force = false) => {
      if (!enabled) return undefined;
      const hit = readCache();
      if (force !== true && !hit.stale) {
        if (hit.value !== undefined) {
          setData(hit.value);
          setDataScope(scopeKey);
          setError(null);
          setLoading(false);
          return undefined;
        }
      }
      // A stale answer stays on screen while the read goes out again: the
      // page never blanks between two reads, and the numbers it shows are
      // marked as old rather than passed off as current.
      const showingStale = force !== true && hit.stale;
      if (showingStale) {
        setData(hit.value);
        setDataScope(scopeKey);
        setError(null);
      }
      const controller = new AbortController();
      if (!showingStale) {
        setLoading(true);
        setError(null);
      }
      // The same read asked for at the same time is one request, not N.
      const request = dedupeKey
        ? dedupeRequest(
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
