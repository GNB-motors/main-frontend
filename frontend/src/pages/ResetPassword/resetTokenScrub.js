/**
 * The password-reset token must not travel in a URL: a URL ends up in the
 * browser history, in proxy logs and in the referrer of every request the page
 * makes. The inline script in index.html runs before anything else can see the
 * address bar; this module is the same logic in a form a test can call.
 */

export const RESET_PATH = '/reset-password';

/**
 * Move the reset token out of the address bar.
 *
 * The token is copied to `target.__gnbResetToken` (the page reads it once and
 * deletes it again) and the address bar becomes exactly /reset-password: the
 * other query parameters and the fragment go as well, so nothing else of the
 * link survives. The history state is kept, so Back still works.
 *
 * @param {{location?: Location, history?: History, target?: object}} [options]
 * @returns {string|null} the token, or null when there was none
 */
export function scrubResetToken(options = {}) {
  const target = options.target ?? (typeof window !== 'undefined' ? window : undefined);
  const loc = options.location ?? target?.location;
  const hist = options.history ?? target?.history;
  if (!loc || !hist) return null;
  try {
    if (loc.pathname !== RESET_PATH) return null;
    const url = new URL(loc.href);
    const token = url.searchParams.get('token');
    if (!token) return null;
    target.__gnbResetToken = token;
    hist.replaceState(hist.state, '', RESET_PATH);
    return token;
  } catch {
    // Never break the app over this.
    return null;
  }
}

export default scrubResetToken;
