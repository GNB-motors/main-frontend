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

import { getOrgId, getUserId } from './session.js';

let sdk = null;
let initPromise = null;
const pending = [];

const BUFFER_CAP = 20;

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
    if (sdk) {
        report(error, context);
    } else if (pending.length < BUFFER_CAP) {
        pending.push({ error, context });
    }
}

export function initSentry() {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn || initPromise) return initPromise;

    initPromise = import('@sentry/react').then((Sentry) => {
        Sentry.init({
            dsn,
            environment: import.meta.env.MODE,
            // 10% trace sample in production; full traces in dev
            tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
            attachStacktrace: true,
            // Replay + Feedback ship ~370 KB and are not used — drop them
            integrations: (defaults) =>
                defaults.filter((i) => i.name !== 'Replay' && i.name !== 'ReplayCanvas' && i.name !== 'Feedback'),
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
    }).catch(() => {
        // SDK failed to load — error monitoring is best-effort
    });

    return initPromise;
}

export default { initSentry, captureException };
