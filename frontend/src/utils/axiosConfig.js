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

// Response interceptor to handle 401 errors globally
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 errors with auto-logout
        if (error.response?.status === 401) {
            console.log('401 Unauthorized detected in axios interceptor - Auto logging out user');
            handleAuthError(error);
            return Promise.reject(error);
        }
        
        // For other errors, just pass them through
        return Promise.reject(error);
    }
);

export default apiClient;
