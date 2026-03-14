/**
 * Global axios configuration with automatic 401 error handling
 */
import axios from 'axios';
import { handleAuthError } from './authUtils';

// Create axios instance with base configuration
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token to all requests
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
        // Log X-Request-ID on every error so we can correlate with backend logs
        const requestId = error.response?.headers?.['x-request-id'];
        if (requestId) {
            console.error(`[API Error] status=${error.response?.status} url=${error.config?.url} requestId=${requestId}`);
        }

        // Handle 401 errors with auto-logout
        if (error.response?.status === 401) {
            handleAuthError(error);
            return Promise.reject(error);
        }

        // Handle 429 Too Many Requests — surface a clear message instead of a generic error
        if (error.response?.status === 429) {
            const msg = error.response?.data?.message || 'Too many requests. Please wait a moment and try again.';
            error.userMessage = msg;
            return Promise.reject(error);
        }

        // For other errors, just pass them through
        return Promise.reject(error);
    }
);

export default apiClient;
