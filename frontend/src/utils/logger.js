/**
 * Central logger: leveled, tagged console output (dev only) with error
 * forwarding to Sentry. Mirrors the DriverApp logger pattern.
 *
 * - Console output is DEV-ONLY (import.meta.env.DEV). In production we
 *   neither console.* nor leak potentially sensitive data to the console.
 * - Errors are always forwarded to utils/sentry.js captureException, which
 *   no-ops when no DSN is set and buffers events until the SDK lazily loads.
 */

import { captureException } from './sentry.js';

const IS_DEV = import.meta.env.DEV;

const LEVELS = {
  info: { label: 'INFO ', method: 'log' },
  warn: { label: 'WARN ', method: 'warn' },
  error: { label: 'ERROR', method: 'error' },
  api: { label: 'API  ', method: 'log' },
};

function timestamp() {
  return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// Forward errors to Sentry so production failures stay visible even though
// we do not console.* in production. sentry.js captureException accepts
// (error, { tags, extra }) and never throws.
function reportErrorToSentry(tag, message, data) {
  if (message instanceof Error) {
    captureException(message, {
      tags: { loggerTag: tag },
      ...(data !== undefined && { extra: { data: safeStringify(data) } }),
    });
  } else {
    const err = new Error(`[${tag}] ${message}`);
    captureException(err, {
      tags: { loggerTag: tag },
      ...(data !== undefined && { extra: { data: safeStringify(data) } }),
    });
  }
}

function write(level, tag, message, data) {
  if (IS_DEV) {
    const { label, method } = LEVELS[level] || LEVELS.info;
    const prefix = `[${label}] ${timestamp()} [${tag}] ${message}`;
    if (data !== undefined) console[method](prefix, data);
    else console[method](prefix);
  }

  if (level === 'error') {
    reportErrorToSentry(tag, message, data);
  }
}

const logger = {
  info: (tag, message, data) => write('info', tag, message, data),
  warn: (tag, message, data) => write('warn', tag, message, data),
  error: (tag, message, data) => write('error', tag, message, data),

  /** Structured helper for API calls — logs method + path + status in one line. */
  api: (method, path, status, data) =>
    write('api', 'API', `${method} ${path} → ${status ?? '…'}`, data),
};

export default logger;
