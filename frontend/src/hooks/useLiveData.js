import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useLiveData — REST-first, SSE-upgraded live data (OVERHAUL_MASTER_PLAN §A.5).
 *
 *   const { data, status, lastEventAt, connectionState, refresh } = useLiveData('positions', {
 *     initialFetch: () => LiveTrackingService.getPositions(),
 *     applyDiff: (current, changed) => mergeByKey(current, changed, 'registrationNumber'),
 *   });
 *
 * Contract:
 * - initialFetch runs once on mount and its result becomes the base dataset.
 * - The SSE client (lib/liveStream) is lazy-imported, so this hook adds nothing
 *   to the eager bundle; the stream chunk loads on first use.
 * - Streamed payloads for `eventType` are merged into the dataset via applyDiff
 *   (default: replace).
 * - On every successful (re)connect the REST fetch runs once more — an SSE gap
 *   may have dropped events while the socket was down.
 * - If the backend stream is not deployed yet, the hook silently stays
 *   REST-only: no error is surfaced and the page keeps its polling fallback.
 *
 * Feeding the freshness primitive: pass `lastEventAt` to PageShell's
 * `freshnessAt` prop (it renders cluster/FreshnessBadge) — the badge then
 * reflects the newest data the UI actually holds, whether it arrived by REST
 * poll or by push.
 */

/** Merge streamed diff rows into the current dataset by a stable key. Rows whose key is not present yet are appended (a diff may reference a vehicle the base fetch missed). */
export function mergeByKey(current, changed, key) {
  if (!Array.isArray(current) || !Array.isArray(changed)) return changed;
  const index = new Map(current.map((row, i) => [row?.[key], i]));
  const next = current.slice();
  for (const row of changed) {
    const k = row?.[key];
    if (k === undefined) continue;
    if (index.has(k)) next[index.get(k)] = row;
    else {
      index.set(k, next.length);
      next.push(row);
    }
  }
  return next;
}

export function useLiveData(eventType, { initialFetch, applyDiff, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('closed');
  const [lastEventAt, setLastEventAt] = useState(null);

  // Callers pass inline lambdas; keeping them in refs stops the subscription
  // effect from tearing down on every render.
  const fetchRef = useRef(initialFetch);
  const applyRef = useRef(applyDiff);
  fetchRef.current = initialFetch;
  applyRef.current = applyDiff;

  const runFetch = useCallback(async ({ initial = false } = {}) => {
    const fetcher = fetchRef.current;
    if (!fetcher) return;
    if (initial) setStatus('loading');
    try {
      const rows = await fetcher();
      setData(rows);
      setError(null);
      setLastEventAt(new Date());
      setStatus('ready');
    } catch (err) {
      setError(err);
      // A failed refresh must not blank a previously good dataset.
      setStatus((prev) => (prev === 'ready' ? 'ready' : 'error'));
    }
  }, []);

  useEffect(() => {
    if (!enabled || !fetchRef.current) return undefined;
    let cancelled = false;
    let unsubscribe = null;
    let unsubscribeState = null;

    runFetch({ initial: true });

    // Lazy-load the transport so the eager bundle never pays for it.
    import('../lib/liveStream')
      .then(({ getLiveStream }) => {
        if (cancelled) return;
        const stream = getLiveStream();
        unsubscribe = stream.subscribe(eventType, (payload) => {
          setData((current) => (applyRef.current ? applyRef.current(current, payload) : payload));
          setLastEventAt(new Date());
          setStatus((prev) => (prev === 'loading' ? 'ready' : prev));
        });
        unsubscribeState = stream.onConnectionState((s) => {
          setConnectionState(s);
          // Resynchronise after any (re)connect — events may have been dropped
          // while the socket was down.
          if (s === 'open') runFetch();
        });
        setConnectionState(stream.getState());
      })
      .catch(() => {
        // Transport chunk failed to load: stay REST-only, same as no stream.
      });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
      if (unsubscribeState) unsubscribeState();
    };
  }, [enabled, eventType, runFetch]);

  const refresh = useCallback(() => runFetch(), [runFetch]);

  return { data, status, error, connectionState, lastEventAt, refresh };
}

export default useLiveData;
