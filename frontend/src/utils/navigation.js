/**
 * Router bridge — lets non-React modules (the axios interceptor, authUtils)
 * navigate through React Router instead of `window.location`.
 *
 * A hard `window.location.href = ...` tears down the whole app: every bit of
 * component state, every in-flight request and every cached chunk is thrown
 * away. Routing through the router keeps the SPA alive, so a redirect to
 * /login costs a route change instead of a full reload.
 *
 * App.jsx registers the navigate function on mount. Until it does (or if the
 * router itself is what crashed) we fall back to a hard navigation.
 */

let navigate = null;

export const setNavigator = (fn) => {
  navigate = typeof fn === 'function' ? fn : null;
};

/** Paths where an auth failure is the page's own business, not a session loss. */
const AUTH_PATHS = ['/login', '/signup', '/sign-up', '/forgot-password', '/reset-password'];

export const isOnAuthPage = (pathname = window.location?.pathname ?? '') =>
  AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Navigate to `path`. Returns true if the router handled it (soft), false if
 * we had to fall back to a full page load.
 */
export const navigateTo = (path, { replace = true, state } = {}) => {
  if (navigate) {
    navigate(path, { replace, state });
    return true;
  }
  window.location.assign(path);
  return false;
};

export default { setNavigator, navigateTo, isOnAuthPage };
