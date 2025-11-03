/**
 * Authentication utilities for token management and auto-logout
 */

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} - True if token is expired, false otherwise
 */
export const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000; // Convert to seconds
        return payload.exp < currentTime;
    } catch (error) {
        console.error('Error parsing token:', error);
        return true; // If we can't parse it, consider it expired
    }
};

/**
 * Get token expiration time in a readable format
 * @param {string} token - JWT token
 * @returns {Date|null} - Expiration date or null if invalid
 */
export const getTokenExpiration = (token) => {
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return new Date(payload.exp * 1000);
    } catch (error) {
        console.error('Error parsing token expiration:', error);
        return null;
    }
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = () => {
    // Clear auth tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenType');
    
    // Clear profile data
    localStorage.removeItem('profile_id');
    localStorage.removeItem('profile_user_id');
    localStorage.removeItem('profile_company_name');
    localStorage.removeItem('profile_business_ref_id');
    localStorage.removeItem('profile_color');
    localStorage.removeItem('profile_is_onboarded');
    localStorage.removeItem('profile_is_superadmin');
    
    console.log('Auth data cleared - user logged out');
};

/**
 * Handle 401 unauthorized responses with auto-logout
 * @param {Object} error - API error response
 * @param {Function} onLogout - Callback function to execute on logout
 */
export const handleAuthError = (error, onLogout = null) => {
    if (error?.status === 401 || error?.response?.status === 401) {
        console.log('401 Unauthorized - Auto logging out user');
        clearAuthData();
        
        if (onLogout) {
            onLogout();
        } else {
            // Default behavior: redirect to login
            window.location.href = '/login';
        }
        return true; // Indicates auth error was handled
    }
    return false; // Not an auth error
};

/**
 * Check token before making API calls and auto-logout if expired
 * @param {Function} onLogout - Callback function to execute on logout
 * @returns {boolean} - True if token is valid, false if expired
 */
export const validateTokenBeforeRequest = (onLogout = null) => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        console.log('No auth token found');
        if (onLogout) onLogout();
        else window.location.href = '/login';
        return false;
    }
    
    if (isTokenExpired(token)) {
        console.log('Token expired - Auto logging out user');
        clearAuthData();
        if (onLogout) onLogout();
        else window.location.href = '/login';
        return false;
    }
    
    return true;
};

/**
 * Get remaining time until token expires
 * @param {string} token - JWT token
 * @returns {Object} - Object with days, hours, minutes, seconds remaining
 */
export const getTokenTimeRemaining = (token) => {
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const remainingSeconds = payload.exp - currentTime;
        
        if (remainingSeconds <= 0) return null;
        
        const days = Math.floor(remainingSeconds / 86400);
        const hours = Math.floor((remainingSeconds % 86400) / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = Math.floor(remainingSeconds % 60);
        
        return { days, hours, minutes, seconds, totalSeconds: remainingSeconds };
    } catch (error) {
        console.error('Error calculating token time remaining:', error);
        return null;
    }
};
