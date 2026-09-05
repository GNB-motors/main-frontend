/**
 * Global axios configuration with automatic 401 error handling
 */
import axios from 'axios';
import { captureException } from './sentry';
import { handleAuthError } from './authUtils';
import { getToken, getOrgId, getBranchId } from './session';
import ApiError from '../errors/ApiError';

// Create axios instance with base configuration
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000, // 10 second timeout
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
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
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
            console.error(`[API Error] status=${error.response?.status} url=${error.config?.url} requestId=${requestId}`);
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

        // Handle 401 errors with auto-logout
        if (error.response?.status === 401) {
            handleAuthError(error);
            return Promise.reject(apiError);
        }

        // Handle 429 Too Many Requests — surface a clear message instead of a generic error
        if (error.response?.status === 429) {
            const msg = error.response?.data?.message || 'Too many requests. Please wait a moment and try again.';
            apiError.userMessage = msg;
            return Promise.reject(apiError);
        }

        // For other errors, just pass them through
        return Promise.reject(apiError);
    }
);

export default apiClient;
