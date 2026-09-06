import apiClient from '../utils/axiosConfig';

/**
 * liveStream — one shared SSE connection per session (OVERHAUL_MASTER_PLAN §A.5).
 *
 * The backend stream is ticket-authenticated because browser EventSource cannot
 * set an Authorization header: POST /api/live/ticket (normal bearer auth via the
 * axios interceptor) returns a 60 s single-use token, which is then burned on
 * connect by GET /api/live/stream?ticket=....
 *
 *   const stream = getLiveStream();
 *   const unsub = stream.subscribe('positions', (payload) => ...);
 *   const unsubState = stream.onConnectionState((s) => ...); // 'connecting' | 'open' | 'reconnecting' | 'closed'
 *
 * First subscriber opens the connection, last unsubscribe closes it after a
 * 30 s grace period so route changes don't thrash it. Reconnects use
 * exponential backoff 1 s → 30 s with full jitter, and the ticket is re-minted
 * per attempt (tickets are single-use). While the document is hidden for more
 * than 5 minutes the connection is closed and reopened on visibility so a
 * backgrounded tab does not hold a server slot all night.
 *
 * Degradation contract: if the ticket endpoint does not exist yet (404), the
 * client settles into 'closed' and only retries every 5 minutes while it still
 * has subscribers — a page mounted for hours must not hammer a missing route.
 * All transport failures are expressed through connectionState, never thrown
 * at subscribers.
 */

export const BACKOFF_MIN_MS = 1000;
export const BACKOFF_MAX_MS = 30000;
export const BACKOFF_FULL_JITTER = true;
export const GRACE_PERIOD_MS = 30 * 1000;
export const HIDDEN_CLOSE_MS = 5 * 60 * 1000;
export const MISSING_ENDPOINT_RETRY_MS = 5 * 60 * 1000;

const MAX_ATTEMPT_BEFORE_CAP = Math.floor(Math.log2(BACKOFF_MAX_MS / BACKOFF_MIN_MS));

/** Exponential backoff with full jitter: delay doubles per attempt, then a uniform random fraction keeps reconnect storms from aligning. */
export function backoffDelayMs(attempt, rand = Math.random) {
  const capped = Math.min(Math.max(attempt, 0), MAX_ATTEMPT_BEFORE_CAP);
  const ceiling = BACKOFF_MIN_MS * 2 ** capped;
  return BACKOFF_FULL_JITTER ? Math.floor(rand() * ceiling) : ceiling;
}

const defaultDeps = {
  // Bearer + X-Org-Id / X-Branch-Id headers come from the axios interceptor —
  // identical auth to every other API call.
  requestTicket: () => apiClient.post('/api/live/ticket').then((res) => res.data?.ticket),
  openStream: (url) => new EventSource(url),
  streamUrl: (ticket) => `/api/live/stream?ticket=${encodeURIComponent(ticket)}`,
  visibility: typeof document !== 'undefined' ? document : null,
};

export function createLiveStream(deps = {}) {
  const { requestTicket, openStream, streamUrl, visibility } = { ...defaultDeps, ...deps };

  /** eventType -> Set<handler> */
  const handlers = new Map();
  const stateHandlers = new Set();

  let state = 'closed';
  let source = null;
  let reconnectTimer = null;
  let graceTimer = null;
  let hiddenTimer = null;
  let missingEndpointTimer = null;
  let attempt = 0;

  const emitState = (next) => {
    if (next === state) return;
    state = next;
    stateHandlers.forEach((h) => h(state));
  };

  const getState = () => state;

  const hasSubscribers = () => [...handlers.values()].some((set) => set.size > 0);

  const clearTimers = () => {
    [reconnectTimer, graceTimer, hiddenTimer, missingEndpointTimer].forEach((t) => {
      if (t) clearTimeout(t);
    });
    reconnectTimer = graceTimer = hiddenTimer = missingEndpointTimer = null;
  };

  const closeSource = () => {
    if (source) {
      source.onopen = null;
      source.onerror = null;
      source.close();
      source = null;
    }
  };

  const disconnect = (nextState = 'closed') => {
    clearTimers();
    closeSource();
    attempt = 0;
    emitState(nextState);
  };

  const dispatch = (eventType, raw) => {
    const set = handlers.get(eventType);
    if (!set || set.size === 0) return;
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      // Malformed frame: skip it. A single bad payload must not kill the stream.
      return;
    }
    set.forEach((h) => h(payload));
  };

  const connect = async () => {
    if (source) return;
    clearTimers();
    emitState(attempt === 0 ? 'connecting' : 'reconnecting');
    let ticket;
    try {
      ticket = await requestTicket();
    } catch (err) {
      scheduleReconnect(err);
      return;
    }
    if (!ticket) {
      scheduleReconnect(new Error('ticket endpoint returned no token'));
      return;
    }
    let es;
    try {
      es = openStream(streamUrl(ticket));
    } catch {
      scheduleReconnect(new Error('EventSource construction failed'));
      return;
    }
    if (state === 'closed') {
      // Unsubscribed (or hidden-shutdown) while the ticket request was in flight.
      es.close();
      return;
    }
    source = es;
    es.onopen = () => {
      attempt = 0;
      emitState('open');
    };
    es.onerror = () => {
      // Per SSE semantics the browser auto-reconnects unless we intervene; we
      // manage retries ourselves (fresh ticket each attempt), so tear down and
      // schedule our own backoff reconnect.
      closeSource();
      scheduleReconnect();
    };
    es.onmessage = (ev) => dispatch('message', ev.data);
    // Named events: register per subscribed type so unknown events are ignored.
    ['hello', 'positions', 'alerts', 'freshness'].forEach((type) => {
      es.addEventListener(type, (ev) => dispatch(type, ev.data));
    });
  };

  const scheduleReconnect = (err) => {
    closeSource();
    if (!hasSubscribers() || state === 'closed') {
      emitState('closed');
      return;
    }
    if (err && (err?.response?.status === 404 || err?.status === 404)) {
      // The backend stream module is not deployed yet. Settle into 'closed'
      // and probe again only after a long cooldown — never a tight retry loop.
      emitState('closed');
      missingEndpointTimer = setTimeout(() => {
        missingEndpointTimer = null;
        if (hasSubscribers()) connect();
      }, MISSING_ENDPOINT_RETRY_MS);
      return;
    }
    emitState('reconnecting');
    attempt += 1;
    const delay = backoffDelayMs(attempt);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  };

  const onVisibilityChange = () => {
    if (!visibility) return;
    if (visibility.visibilityState === 'hidden') {
      // Don't close immediately — a quick tab switch must not drop the stream.
      hiddenTimer = setTimeout(() => {
        hiddenTimer = null;
        if (source) disconnect('closed');
      }, HIDDEN_CLOSE_MS);
      return;
    }
    if (hiddenTimer) {
      clearTimeout(hiddenTimer);
      hiddenTimer = null;
      return;
    }
    if (!source && hasSubscribers() && state === 'closed') connect();
  };

  if (visibility) {
    visibility.addEventListener('visibilitychange', onVisibilityChange);
  }

  const subscribe = (eventType, handler) => {
    if (!handlers.has(eventType)) handlers.set(eventType, new Set());
    handlers.get(eventType).add(handler);
    // A returning subscriber within the grace period reuses the open
    // connection; if the socket was down (backoff cancelled on unsubscribe),
    // reconnect now.
    if (graceTimer) {
      clearTimeout(graceTimer);
      graceTimer = null;
    }
    if (!source && !reconnectTimer && !missingEndpointTimer) connect();
    return () => {
      const set = handlers.get(eventType);
      if (!set) return;
      set.delete(handler);
      if (set.size === 0) handlers.delete(eventType);
      if (!hasSubscribers()) {
        // Last subscriber left: keep the connection briefly so a route change
        // (unmount + immediate remount) reuses it, but stop any in-flight
        // reconnect — no fresh ticket for an audience of zero.
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        graceTimer = setTimeout(() => {
          graceTimer = null;
          if (!hasSubscribers()) disconnect('closed');
        }, GRACE_PERIOD_MS);
      }
    };
  };

  const onConnectionState = (handler) => {
    stateHandlers.add(handler);
    return () => stateHandlers.delete(handler);
  };

  return {
    subscribe,
    onConnectionState,
    getState,
    /** Test/lifecycle teardown: close everything and drop the singleton. */
    dispose() {
      if (visibility) {
        visibility.removeEventListener('visibilitychange', onVisibilityChange);
      }
      handlers.clear();
      stateHandlers.clear();
      disconnect('closed');
    },
  };
}

let singleton = null;

/** Lazy singleton per A.5: first subscriber opens it, dispose on logout. */
export function getLiveStream() {
  if (!singleton) singleton = createLiveStream();
  return singleton;
}

/** For tests only — reset the module-level singleton. */
export function resetLiveStream() {
  if (singleton) singleton.dispose();
  singleton = null;
}
