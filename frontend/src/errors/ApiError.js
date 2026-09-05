/**
 * ApiError — typed error for failed API requests.
 *
 * Wraps an axios error (or any thrown value) and preserves everything a caller
 * needs to react precisely: HTTP status, X-Request-ID, the response body, and
 * the original error. Helper getters cover the common branches so components
 * don't re-implement status checks inline.
 *
 * Backward compatible with existing catch blocks: `.response`, `.config`,
 * `.code` and `.userMessage` are all preserved from the source error.
 */
export class ApiError extends Error {
  constructor(
    message,
    { status = null, requestId = null, body = null, code = null, cause = null } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
    this.body = body;
    this.code = code;
    this.cause = cause;
    // axios-style aliases so legacy `error.response?.data` catch blocks keep working
    this.response = cause?.response ?? null;
    this.config = cause?.config ?? null;
    if (cause?.userMessage) this.userMessage = cause.userMessage;
  }

  /** No HTTP status but a transport code (ECONNABORTED, ERR_NETWORK, timeout). */
  get isNetworkError() {
    return this.status === null && this.code != null;
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  get isRateLimited() {
    return this.status === 429;
  }

  get isServerError() {
    return typeof this.status === 'number' && this.status >= 500;
  }

  /** Best human-readable message from the response body, else the fallback. */
  get displayMessage() {
    return this.body?.message || this.body?.detail || this.userMessage || this.message;
  }

  /**
   * Convert any thrown value into an ApiError. Idempotent — returns the value
   * unchanged if it is already an ApiError.
   */
  static from(error, fallbackMessage = 'Request failed') {
    if (error instanceof ApiError) return error;
    const status = error?.response?.status ?? null;
    const requestId = error?.response?.headers?.['x-request-id'] ?? null;
    const body = error?.response?.data ?? null;
    const message =
      body?.message || body?.detail || error?.userMessage || error?.message || fallbackMessage;
    return new ApiError(message, {
      status,
      requestId,
      body,
      code: error?.code ?? null,
      cause: error,
    });
  }
}

export default ApiError;
