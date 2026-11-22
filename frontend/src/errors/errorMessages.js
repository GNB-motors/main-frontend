/**
 * errorMessages — one place that turns a failed request into plain words.
 *
 * The house rules this file encodes:
 *  - The owner reads a sentence, never a stack trace, a "Error 500" headline or
 *    a raw server message.
 *  - 401 means "sign in again"; 403 means "you don't have access to this".
 *  - A failure that can be retried says so; the status, request id and the raw
 *    error stay available for the logger and for support, but they never reach
 *    the screen as the headline.
 */

export const ERROR_KIND = {
  AUTH: 'auth',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  RATE_LIMITED: 'rate_limited',
  NETWORK: 'network',
  SERVER: 'server',
  REQUEST: 'request',
  UNKNOWN: 'unknown',
};

/** HTTP status of anything that was thrown, or null when there was no response. */
export function getErrorStatus(error) {
  if (!error) return null;
  const status = error.status ?? error.response?.status ?? null;
  return typeof status === 'number' ? status : null;
}

/** Request id the backend sent, used as the support reference. */
export function getRequestId(error) {
  if (!error) return null;
  return (
    error.requestId ??
    error.response?.headers?.['x-request-id'] ??
    error.response?.data?.requestId ??
    null
  );
}

/** The house headline for a failure. The specific reason sits on the line below. */
export const GENERIC_ERROR_TITLE = "Couldn't load this.";

/**
 * describeError — the single mapping from a failed request to what the owner
 * is told. Never throws; an unknown error still gets a sentence and a next step.
 */
export function describeError(error, { fallbackTitle = GENERIC_ERROR_TITLE } = {}) {
  const status = getErrorStatus(error);
  const requestId = getRequestId(error);
  const code = error?.code ?? null;
  const base = { status, requestId, code };

  if (status === 401) {
    return {
      ...base,
      kind: ERROR_KIND.AUTH,
      title: 'Your session has ended.',
      message: 'Sign in again to carry on where you left off.',
      retryable: false,
      needsLogin: true,
    };
  }

  if (status === 403) {
    return {
      ...base,
      kind: ERROR_KIND.FORBIDDEN,
      title: "You don't have access to this.",
      message: 'Ask an administrator if you need this part of the workspace.',
      retryable: false,
    };
  }

  if (status === 404) {
    return {
      ...base,
      kind: ERROR_KIND.NOT_FOUND,
      title: GENERIC_ERROR_TITLE,
      message:
        'This information is not available. The server could not find it. It may not be set up for your account yet.',
      retryable: false,
    };
  }

  if (status === 429) {
    return {
      ...base,
      kind: ERROR_KIND.RATE_LIMITED,
      title: GENERIC_ERROR_TITLE,
      message: 'Too many requests just now. Wait a moment, then try again.',
      retryable: true,
    };
  }

  if (status !== null && status >= 500) {
    return {
      ...base,
      kind: ERROR_KIND.SERVER,
      title: GENERIC_ERROR_TITLE,
      message: 'The server had a problem. Nothing was changed. Try again in a moment.',
      retryable: true,
    };
  }

  if (status !== null && status >= 400) {
    return {
      ...base,
      kind: ERROR_KIND.REQUEST,
      title: GENERIC_ERROR_TITLE,
      message: "We couldn't complete that request. It was not accepted. Try again.",
      retryable: true,
    };
  }

  if (status === null && code) {
    return {
      ...base,
      kind: ERROR_KIND.NETWORK,
      title: GENERIC_ERROR_TITLE,
      message: 'No connection to the server. Check your connection and try again.',
      retryable: true,
    };
  }

  return {
    ...base,
    kind: ERROR_KIND.UNKNOWN,
    title: fallbackTitle,
    message: 'Something went wrong on our side. Try again.',
    retryable: true,
  };
}

export default describeError;
