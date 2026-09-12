/**
 * Authentication utilities for token management and auto-logout
 */
import { clearSession, getToken } from './session.js';
import { navigateTo, isOnAuthPage } from './navigation.js';

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
 * Clear all authentication data from the session store
 */
export const clearAuthData = () => {
  clearSession();
  console.log('Auth data cleared - user logged out');
};

/**
 * Server messages that mean "this session is over". Anything else behind a 401
 * is endpoint-specific (an upstream provider's credentials, a stream ticket, a
 * login form's own wrong-password answer) and must NOT destroy the session.
 *
 * Matched exactly, not by substring: the FleetEdge/GSP proxy relays upstream
 * failures as "GSP authentication failed / token expired", which contains two
 * of these phrases while saying nothing about OUR session.
 */
const SESSION_INVALID_MESSAGES = new Set([
  'no token provided',
  'token expired',
  'invalid token',
  'authentication failed',
  'authentication required',
  'user not found',
]);

const statusOf = (error) => error?.status ?? error?.response?.status ?? null;

const messageOf = (error) =>
  String(
    error?.response?.data?.message ??
      error?.body?.message ??
      error?.response?.data?.detail ??
      error?.message ??
      '',
  )
    .trim()
    .toLowerCase();

/**
 * Is this 401 proof that OUR session is dead, rather than a 401 about
 * something else the endpoint touched?
 *
 * Yes when we hold no token at all, when the token we hold has already
 * expired, or when the server named a session-level reason. A structurally
 * valid, unexpired token plus an unrecognised 401 reason is treated as an
 * ordinary request failure — the page shows an error, the user stays put.
 */
export const isSessionInvalid401 = (error) => {
  if (statusOf(error) !== 401) return false;
  const token = getToken();
  if (!token || isTokenExpired(token)) return true;
  return SESSION_INVALID_MESSAGES.has(messageOf(error));
};

/**
 * Handle a 401 by logging out — but only when the session is genuinely gone.
 *
 * Previously ANY 401 from ANY request hard-navigated the browser to /login, so
 * one background poller or one endpoint proxying an upstream 401 ejected the
 * user mid-page and discarded all app state. Now the blast radius is scoped:
 * pass `skipAuthRedirect: true` in an axios request config to opt a call out
 * entirely, and auth pages handle their own 401s.
 *
 * @param {Object} error - API error (axios error, ApiError, or { status })
 * @param {Function} [onLogout] - overrides the default redirect to /login
 * @returns {boolean} true if the error was consumed as a logout
 */
export const handleAuthError = (error, onLogout = null) => {
  if (statusOf(error) !== 401) return false;
  if (error?.config?.skipAuthRedirect) return false;
  if (isOnAuthPage()) return false;
  if (!isSessionInvalid401(error)) return false;

  clearAuthData();

  if (onLogout) {
    onLogout();
  } else {
    navigateTo('/login', { replace: true, state: { reason: 'session-expired' } });
  }
  return true;
};

/**
 * Check token before making API calls and auto-logout if expired
 * @param {Function} onLogout - Callback function to execute on logout
 * @returns {boolean} - True if token is valid, false if expired
 */
export const validateTokenBeforeRequest = (onLogout = null) => {
  const token = getToken();

  if (!token) {
    console.log('No auth token found');
    if (onLogout) onLogout();
    else if (!isOnAuthPage()) navigateTo('/login', { replace: true });
    return false;
  }

  if (isTokenExpired(token)) {
    console.log('Token expired - Auto logging out user');
    clearAuthData();
    if (onLogout) onLogout();
    else if (!isOnAuthPage())
      navigateTo('/login', { replace: true, state: { reason: 'session-expired' } });
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
