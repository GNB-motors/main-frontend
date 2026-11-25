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

// ── Redaction ───────────────────────────────────────────────────────────────
// A password-reset token must never reach Sentry (or LEMU): it is a one-time
// credential and the reset URL is the one place it travels.
const SECRET_PARAM =
  '(token|resetToken|reset_token|accessToken|access_token|refreshToken|refresh_token)';

// A secret assignment anywhere: "?token=…", "&token=…", "token=…" in a bare
// query string or in a stack trace. The boundary keeps "my_token=…" apart
// from "reset_token=…" (which is matched as a whole).
const SECRET_ASSIGNMENT = new RegExp(`(^|[^A-Za-z0-9_])(${SECRET_PARAM})=([^&#\\s]*)`, 'gim');

const REDACTED = '[redacted]';

// A secret inside a JSON body that was serialised into a string:
// '{"token":"…","password":"…"}'. The body of a reset call is exactly that.
const JSON_REDACTED = '[REDACTED]';
const JSON_SECRET_KEY =
  '(token|resetToken|reset_token|accessToken|access_token|refreshToken|refresh_token|password|newPassword|new_password|otp|code|secret)';
const JSON_SECRET = new RegExp(`("${JSON_SECRET_KEY}"\\s*:\\s*)"(?:[^"\\\\]|\\\\.)*"`, 'gi');

// A route whose request body is a secret (a reset, or a password change).
const SECRET_ROUTE = /(password-reset|reset-password|\/password)/i;

// The keys are matched case-insensitively ("Authorization" is "authorization").
const SECRET_KEYS_LOWER = new Set(
  [
    'token',
    'resetToken',
    'reset_token',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'password',
    'newPassword',
    'new_password',
    'authorization',
  ].map((key) => key.toLowerCase()),
);

/**
 * Replace the value of every secret query parameter in a URL (or in a bare
 * query string).
 * @param {string} url
 * @returns {string}
 */
export function scrubUrl(url) {
  if (typeof url !== 'string') return url;
  return url.replace(SECRET_ASSIGNMENT, (_m, boundary, key) => `${boundary}${key}=${REDACTED}`);
}

/**
 * Redact the secrets of a JSON body that was serialised into a string.
 * @param {string} text
 * @returns {string}
 */
export function scrubJsonSecrets(text) {
  if (typeof text !== 'string') return text;
  return text.replace(JSON_SECRET, (_m, key) => `${key}"${JSON_REDACTED}"`);
}

/**
 * Copy a value with every secret field and every secret query value redacted.
 * @param {*} value
 * @returns {*}
 */
export function scrubValue(value) {
  if (typeof value === 'string') return scrubJsonSecrets(scrubUrl(value));
  if (Array.isArray(value)) return value.map((item) => scrubValue(item));
  if (value && typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach((key) => {
      if (SECRET_KEYS_LOWER.has(String(key).toLowerCase())) {
        out[key] = REDACTED;
      } else {
        out[key] = scrubValue(value[key]);
      }
    });
    return out;
  }
  return value;
}

const scrubFrames = (frames) =>
  Array.isArray(frames)
    ? frames.map((frame) => {
        if (!frame || typeof frame !== 'object') return frame;
        const next = { ...frame };
        if (next.vars) next.vars = scrubValue(next.vars);
        if (typeof next.filename === 'string') next.filename = scrubUrl(next.filename);
        return next;
      })
    : frames;

const scrubStacktrace = (stacktrace) => {
  if (!stacktrace || typeof stacktrace !== 'object') return stacktrace;
  const next = { ...stacktrace };
  if (next.frames) next.frames = scrubFrames(next.frames);
  return next;
};

const scrubExceptionValue = (value) => {
  if (!value || typeof value !== 'object') return value;
  const next = { ...value };
  if (typeof next.value === 'string') next.value = scrubValue(next.value);
  if (next.stacktrace) next.stacktrace = scrubStacktrace(next.stacktrace);
  return next;
};

/**
 * Scrub an event before it leaves the browser: no token in the URL, no
 * request body (a reset body carries the token AND the new password).
 * @param {Object} event
 * @returns {Object}
 */
export function scrubEvent(event) {
  if (!event || typeof event !== 'object') return event;
  const out = { ...event };

  // The message and the transaction name are plain strings and can carry the
  // reset URL (or a serialised body) just as well.
  if (typeof out.message === 'string') out.message = scrubValue(out.message);
  if (typeof out.transaction === 'string') out.transaction = scrubValue(out.transaction);

  if (out.request && typeof out.request === 'object') {
    const request = { ...out.request };
    if (typeof request.url === 'string') request.url = scrubUrl(request.url);
    if (typeof request.query_string === 'string') request.query_string = scrubUrl(request.query_string);
    // The body of a reset call is a secret — it never gets attached. Any other
    // body stays, but its secrets are redacted.
    if (SECRET_ROUTE.test(String(request.url || ''))) {
      delete request.data;
      delete request.body;
    } else {
      if (request.data !== undefined) request.data = scrubValue(request.data);
      if (request.body !== undefined) request.body = scrubValue(request.body);
    }
    if (request.headers && typeof request.headers === 'object') {
      request.headers = scrubValue(request.headers);
    }
    out.request = request;
  }

  if (out.tags) out.tags = scrubValue(out.tags);
  if (out.extra) out.extra = scrubValue(out.extra);
  if (out.contexts) out.contexts = scrubValue(out.contexts);
  if (Array.isArray(out.breadcrumbs)) {
    out.breadcrumbs = out.breadcrumbs.map((crumb) => {
      if (!crumb || typeof crumb !== 'object') return crumb;
      const next = { ...crumb };
      if (typeof next.url === 'string') next.url = scrubUrl(next.url);
      if (typeof next.message === 'string') next.message = scrubValue(next.message);
      if (next.data && typeof next.data === 'object') next.data = scrubValue(next.data);
      return next;
    });
  }
  if (Array.isArray(out.exception)) {
    out.exception = out.exception.map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      const next = { ...entry };
      if (typeof next.value === 'string') next.value = scrubValue(next.value);
      if (Array.isArray(next.values)) next.values = next.values.map(scrubExceptionValue);
      if (next.stacktrace) next.stacktrace = scrubStacktrace(next.stacktrace);
      return next;
    });
  } else if (out.exception && typeof out.exception === 'object') {
    const next = { ...out.exception };
    if (Array.isArray(next.values)) next.values = next.values.map(scrubExceptionValue);
    if (next.stacktrace) next.stacktrace = scrubStacktrace(next.stacktrace);
    out.exception = next;
  }
  return out;
}

// ── In-house capture (LEMU) ────────────────────────────────────────────────
// Sentry is a no-op unless VITE_SENTRY_DSN is set, so on its own captured
// errors go nowhere. The backend LEMU pipeline (POST /telemetry/ingest →
// source-mapped errors dashboard + Discord alerts) is always available, so we
// mirror every captured exception to it. Deduped per-fingerprint to avoid
// flooding on a render loop; best-effort and never throws.
// Same mount the backend uses for extension telemetry (app.js: /api/extension/telemetry),
// under the API base the rest of the app already targets (VITE_API_BASE_URL). The
// base carries no /api segment — every axios call adds it ('/api/...') — so the
// endpoint must too; without it every report 404s and errors never reach LEMU.
export function lemuEndpoint(base) {
  return `${(base || '').replace(/\/+$/, '')}/api/extension/telemetry/ingest`;
}

const LEMU_ENDPOINT = lemuEndpoint(import.meta.env.VITE_API_BASE_URL);
const LEMU_DEDUPE_MS = 60_000;
const lemuSeen = new Map();

function lemuFingerprint(error, message) {
  const name = error?.name || 'Error';
  const msg = (message || String(error) || '').slice(0, 120);
  return `web:${name}:${msg}`;
}

/**
 * The captured axios error carries the request body in `config.data`. For a
 * reset or a password change that body holds the token and the new password,
 * so it is dropped before the error is handed to Sentry or to LEMU.
 * @param {*} error
 * @returns {*} the error, without the body
 */
export function scrubAxiosError(error) {
  if (!error || typeof error !== 'object') return error;
  const config = error.config;
  if (!config || !config.data) return error;
  if (!SECRET_ROUTE.test(String(config.url || ''))) return error;
  const next = Object.assign(new Error(error?.message || 'Request failed'), error);
  next.name = error?.name || 'Error';
  next.config = { ...config };
  delete next.config.data;
  return next;
}

/**
 * The event that goes to LEMU. Everything in it is scrubbed first: the error
 * message and the stack can carry the reset URL (and with it the token), and
 * so can the context the caller passed in.
 * @param {Error} error
 * @param {{tags?: Object, extra?: Object}} [context]
 */
export function buildLemuEvent(error, context = {}) {
  const rawMessage = String(error?.message || error || 'Unknown error').slice(0, 500);
  const message = scrubValue(rawMessage);
  const extra = {
    ...(context.extra || {}),
    ...(context.tags || {}),
    path: typeof window !== 'undefined' ? window.location?.pathname : undefined,
    orgId: getOrgId() || undefined,
    userId: getUserId() || undefined,
  };
  return {
    source: 'FRONTEND',
    severity: 'ERROR',
    layer: 'UI',
    errorName: error?.name || 'Error',
    message,
    stack: error?.stack ? scrubValue(String(error.stack)) : null,
    fingerprint: lemuFingerprint(error, message),
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
    extra: scrubValue(extra),
    context: scrubValue(context.extra || {}),
  };
}

function reportToLemu(error, context = {}) {
  try {
    if (!import.meta.env.VITE_API_BASE_URL) return;
    const event = buildLemuEvent(error, context);
    const fp = event.fingerprint;
    const now = Date.now();
    const last = lemuSeen.get(fp);
    if (last && now - last < LEMU_DEDUPE_MS) return;
    if (lemuSeen.size > 100) lemuSeen.clear();
    lemuSeen.set(fp, now);

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
  // The request body of a reset call never leaves the browser.
  const safe = scrubAxiosError(error);
  // Always mirror to the in-house LEMU pipeline (works without a Sentry DSN).
  reportToLemu(safe, context);
  if (sdk) {
    report(safe, context);
  } else if (pending.length < BUFFER_CAP) {
    pending.push({ error: safe, context });
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
        // A reset token must never leave the browser.
        beforeSend: (event) => scrubEvent(event),
        beforeBreadcrumb: (crumb) => scrubValue(crumb),
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
