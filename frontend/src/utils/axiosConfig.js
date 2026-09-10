/**
 * Global axios configuration with automatic 401 error handling
 */
import axios from 'axios';
import { captureException } from './sentry';
import { handleAuthError } from './authUtils';
import { getToken, getOrgId, getBranchId } from './session';
import ApiError from '../errors/ApiError';

/**
 * Default request budget. Was 10s, which aborted perfectly healthy analytics
 * responses as ECONNABORTED — indistinguishable from a dead network to every
 * caller, so pages rendered "network error" for a backend that answered fine
 * two seconds later.
 */
export const DEFAULT_TIMEOUT = 30000;

/** Heavy aggregation/report reads that legitimately outrun the default. */
export const SLOW_TIMEOUT = 90000;

/**
 * Path prefixes granted SLOW_TIMEOUT. Matched against the request URL, so a
 * prefix covers every route beneath it. Add a prefix here rather than passing
 * a per-call timeout, so the budget stays visible in one place.
 */
const SLOW_PATH_PREFIXES = [
  '/api/reports',
  '/api/dashboard',
  '/api/mileage/fleet-overview',
  '/api/mileage/model-comparison',
  '/api/mileage/intervals',
  '/api/adblue-logs/comparison',
  '/api/fuel-spend',
  '/api/fuel-comparison',
  '/api/idling-reports',
  '/api/route-intelligence',
  '/api/fleet-coverage',
  '/api/livetracking/positions',
  '/api/audit',
  '/api/hotspots',
  '/api/owner-value',
  '/api/lemu',
  '/api/warehouse',
  '/api/admin/dashboard-stats',
  '/api/admin/platform-fuel-stats',
  '/api/admin/organizations-overview',
];

const isSlowPath = (url = '') => SLOW_PATH_PREFIXES.some((prefix) => url.startsWith(prefix));

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
});

// Request interceptor to add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const orgId = getOrgId();
    if (orgId && !config.headers['X-Org-Id'] && !config.headers['x-org-id']) {
      config.headers['X-Org-Id'] = orgId;
    }
    // Active operational location (branch). Omitted when "All locations" is
    // selected, which the backend reads as the enterprise (all-branches) scope.
    const branchId = getBranchId();
    if (branchId && !config.headers['X-Branch-Id'] && !config.headers['x-branch-id']) {
      config.headers['X-Branch-Id'] = branchId;
    }

    // Widen the budget for known-heavy reads. Only when the timeout is
    // still the instance default — a call that set its own (uploads, OCR)
    // has already made this decision and must not be overridden.
    if (config.timeout === DEFAULT_TIMEOUT && isSlowPath(config.url ?? '')) {
      config.timeout = SLOW_TIMEOUT;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle global error cases
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Normalize what we reject to a typed ApiError. All logging/auth logic
    // below still runs on the raw axios error; ApiError preserves
    // .response/.config/.code/.userMessage so downstream catch blocks that
    // read those fields are unaffected, and additionally exposes
    // .status/.requestId/.body plus the is*Error helpers.
    const apiError = ApiError.from(error);

    // Log X-Request-ID on every error so we can correlate with backend logs
    const requestId = error.response?.headers?.['x-request-id'];
    if (requestId) {
      console.error(
        `[API Error] status=${error.response?.status} url=${error.config?.url} requestId=${requestId}`,
      );
    }

    // Report to Sentry (skips request cancellations — code 'ERR_CANCELED')
    if (error.code !== 'ERR_CANCELED') {
      captureException(error, {
        tags: {
          'api.status': error.response?.status ?? 'network',
          'api.url': error.config?.url ?? 'unknown',
          ...(requestId ? { 'api.requestId': requestId } : {}),
        },
      });
    }

    // Handle 401 errors with auto-logout.
    //
    // handleAuthError is now scoped: it only tears the session down when
    // the 401 actually means the session is gone (no token, expired token,
    // or a session-level reason from the server). An endpoint-specific 401
    // — an upstream provider's credentials, a stream ticket, the login
    // form's own wrong-password answer — falls through and is rejected like
    // any other error, so the page shows it inline instead of the whole app
    // bouncing to /login. Opt a single call out with
    // `apiClient.get(url, { skipAuthRedirect: true })`.
    if (error.response?.status === 401) {
      handleAuthError(error);
      return Promise.reject(apiError);
    }

    // Handle 429 Too Many Requests — surface a clear message instead of a generic error
    if (error.response?.status === 429) {
      const msg =
        error.response?.data?.message || 'Too many requests. Please wait a moment and try again.';
      apiError.userMessage = msg;
      return Promise.reject(apiError);
    }

    // For other errors, just pass them through
    return Promise.reject(apiError);
  },
);

export default apiClient;
