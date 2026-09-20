/**
 * Sentry integration. The @sentry/react SDK is loaded ASYNCHRONOUSLY
 * (dynamic import) so ~500 KB of error-monitoring code never blocks the
 * initial bundle — initSentry() fetches it right after the app mounts.
 *
 * Events that occur before the SDK finishes loading are buffered (up to a
 * small cap) and flushed once init completes. No-op when VITE_SENTRY_DSN
 * is not set, so local/unconfigured environments are unaffected.
 *
 * NOTE: org/user tags are read via utils/session.js getters — the single
 * gateway to persistent storage.
 */

import { getOrgId, getUserId, getToken } from './session.js';

let sdk = null;
let initPromise = null;
const pending = [];

const BUFFER_CAP = 20;

// ── In-house capture (LEMU) ────────────────────────────────────────────────
// Sentry is a no-op unless VITE_SENTRY_DSN is set, so on its own captured
// errors go nowhere. The backend LEMU pipeline (POST /telemetry/ingest →
// source-mapped errors dashboard + Discord alerts) is always available, so we
// mirror every captured exception to it. Deduped per-fingerprint to avoid
// flooding on a render loop; best-effort and never throws.
// Same mount the backend uses for extension telemetry (app.js: /api/extension/telemetry),
// under the API base the rest of the app already targets (VITE_API_BASE_URL).
const LEMU_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL || ''}/extension/telemetry/ingest`;
const LEMU_DEDUPE_MS = 60_000;
const lemuSeen = new Map();

function lemuFingerprint(error) {
  const name = error?.name || 'Error';
  const msg = (error?.message || String(error) || '').slice(0, 120);
  return `web:${name}:${msg}`;
}

function reportToLemu(error, context = {}) {
  try {
    if (!import.meta.env.VITE_API_BASE_URL) return;
    const fp = lemuFingerprint(error);
    const now = Date.now();
    const last = lemuSeen.get(fp);
    if (last && now - last < LEMU_DEDUPE_MS) return;
    if (lemuSeen.size > 100) lemuSeen.clear();
    lemuSeen.set(fp, now);

    const event = {
      source: 'FRONTEND',
      severity: 'ERROR',
      layer: 'UI',
      errorName: error?.name || 'Error',
      message: (error?.message || String(error) || 'Unknown error').slice(0, 500),
      stack: error?.stack || null,
      fingerprint: fp,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
      extra: {
        ...(context.extra || {}),
        ...(context.tags || {}),
        path: typeof window !== 'undefined' ? window.location?.pathname : undefined,
        orgId: getOrgId() || undefined,
        userId: getUserId() || undefined,
      },
    };
    const token = getToken();
    // keepalive lets the POST survive an unload (e.g. an error during navigation).
    fetch(LEMU_ENDPOINT, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ environment: import.meta.env.MODE, events: [event] }),
    }).catch(() => {
      // best-effort: a failed error-report must never surface as another error
    });
  } catch {
    // never let the reporter throw into the caller (an error boundary / handler)
  }
}

function flushPending() {
  while (pending.length > 0 && sdk) {
    const { error, context } = pending.shift();
    report(error, context);
  }
}

function report(error, context) {
  sdk.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
    }
    if (context?.extra) scope.setExtra('extra', context.extra);
    sdk.captureException(error);
  });
}

/**
 * Report an error to Sentry (queues it if the SDK hasn't loaded yet).
 * @param {Error} error
 * @param {{tags?: Object, extra?: Object}} [context]
 */
export function captureException(error, context = {}) {
  // Always mirror to the in-house LEMU pipeline (works without a Sentry DSN).
  reportToLemu(error, context);
  if (sdk) {
    report(error, context);
  } else if (pending.length < BUFFER_CAP) {
    pending.push({ error, context });
  }
}

/**
 * Should this uncaught error be reported by US, or is something else already
 * on it?
 *
 * - once the SDK is live its own GlobalHandlers integration catches window
 *   errors and unhandled rejections, so reporting here would duplicate;
 * - axios failures are already reported by the response interceptor, and they
 *   arrive here as ApiError;
 * - an aborted request is not a fault.
 */
function shouldReportGlobal(error) {
  if (sdk) return false;
  if (error?.name === 'ApiError') return false;
  if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return false;
  return true;
}

/**
 * Catch errors that never reach a try/catch or an error boundary.
 *
 * Without this, an `await` with no catch — a fire-and-forget refresh, a
 * detached promise chain in an effect — fails completely silently: no toast,
 * no console trace the user can report, nothing in Sentry, and a UI that just
 * sits on a spinner. These handlers install synchronously at boot, so they
 * also cover the window before the Sentry SDK finishes loading (events are
 * buffered by captureException and flushed on init).
 *
 * Reporting only — it deliberately does not preventDefault(), so the browser
 * console still shows the original error with its full stack.
 */
export function installGlobalHandlers(target = window) {
  const onRejection = (event) => {
    const reason = event?.reason;
    if (!shouldReportGlobal(reason)) return;
    const error =
      reason instanceof Error ? reason : new Error(`Unhandled rejection: ${String(reason)}`);
    captureException(error, { tags: { mechanism: 'unhandledrejection' } });
  };

  const onError = (event) => {
    const error = event?.error;
    if (!shouldReportGlobal(error)) return;
    captureException(error ?? new Error(event?.message || 'Uncaught error'), {
      tags: { mechanism: 'onerror' },
    });
  };

  target.addEventListener('unhandledrejection', onRejection);
  target.addEventListener('error', onError);

  return () => {
    target.removeEventListener('unhandledrejection', onRejection);
    target.removeEventListener('error', onError);
  };
}

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || initPromise) return initPromise;

  initPromise = import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        // 10% trace sample in production; full traces in dev
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        attachStacktrace: true,
        // Replay + Feedback ship ~370 KB and are not used — drop them
        integrations: (defaults) =>
          defaults.filter(
            (i) => i.name !== 'Replay' && i.name !== 'ReplayCanvas' && i.name !== 'Feedback',
          ),
      });

      const orgId = getOrgId();
      const userId = getUserId();
      if (orgId) Sentry.setTag('orgId', orgId);
      if (userId) {
        Sentry.setTag('userId', userId);
        Sentry.setUser({ id: userId });
      }

      sdk = Sentry;
      flushPending();
      return Sentry;
    })
    .catch(() => {
      // SDK failed to load — error monitoring is best-effort
    });

  return initPromise;
}

export default { initSentry, captureException, installGlobalHandlers };
