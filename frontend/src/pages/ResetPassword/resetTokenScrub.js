/**
 * The password-reset token must not travel in a URL: a URL ends up in the
 * browser history, in proxy logs and in the referrer of every request the page
 * makes. The reset link now carries the token in the FRAGMENT
 * (/reset-password#token=…); the fragment is never sent to a server, so it is
 * the safe place for a one-time credential. The old /reset-password?token=…
 * link still works (legacy emails).
 *
 * The inline script in index.html runs before anything else can see the
 * address bar; this module is the same logic in a form a test can call, plus
 * the reader the page uses.
 */

export const RESET_PATH = '/reset-password';
export const TOKEN_STORAGE_KEY = 'gnb.resetToken';

// React may call a useState initializer twice (StrictMode). The token is
// consumed once; the second call must still see it.
let pendingToken = null;

const readParam = (source, name) => {
  if (!source) return '';
  try {
    const raw = String(source).replace(/^[#?]/, '');
    // "#/route?token=x" as well as "#token=x"
    const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : raw;
    return (new URLSearchParams(query).get(name) || '').trim();
  } catch {
    return '';
  }
};

/**
 * The token in the address bar: the fragment first (the new link), then the
 * query string (the legacy link).
 * @param {Location|{hash?: string, search?: string}} loc
 * @returns {string}
 */
export function readTokenFromLocation(loc) {
  if (!loc) return '';
  const fromHash = readParam(loc.hash, 'token');
  if (fromHash) return fromHash;
  return readParam(loc.search, 'token');
}

/**
 * The token the inline script put aside.
 * @param {Storage} [storage]
 * @returns {string}
 */
export function readStashedToken(storage) {
  try {
    return String(storage?.getItem?.(TOKEN_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

/**
 * Put the token aside, so the page can read it after the address bar is clean.
 * @param {Storage} storage
 * @param {string} token
 */
export function stashToken(storage, token) {
  try {
    storage?.setItem?.(TOKEN_STORAGE_KEY, token);
  } catch {
    // Private mode / storage disabled: the window copy is the fallback.
  }
}

/**
 * Forget the stashed token.
 * @param {Storage} [storage]
 */
export function clearStashedToken(storage) {
  try {
    storage?.removeItem?.(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Move the reset token out of the address bar (the inline script in index.html
 * does the same before the app boots).
 *
 * The token is copied to `target.__gnbResetToken` and to sessionStorage under
 * 'gnb.resetToken' (the page reads it once and clears it again) and the
 * address bar becomes exactly /reset-password: the query string and the
 * fragment go as well, so nothing else of the link survives. The history state
 * is kept, so Back still works.
 *
 * @param {{location?: Location, history?: History, target?: object, storage?: Storage}} [options]
 * @returns {string|null} the token, or null when there was none
 */
export function scrubResetToken(options = {}) {
  const target = options.target ?? (typeof window !== 'undefined' ? window : undefined);
  const loc = options.location ?? target?.location;
  const hist = options.history ?? target?.history;
  const storage = options.storage ?? target?.sessionStorage;
  if (!loc || !hist) return null;
  try {
    if (loc.pathname !== RESET_PATH) return null;
    const token = readTokenFromLocation(loc);
    if (!token) return null;
    stashToken(storage, token);
    target.__gnbResetToken = token;
    hist.replaceState(hist.state, '', RESET_PATH);
    return token;
  } catch {
    // Never break the app over this.
    return null;
  }
}

/**
 * Take the token for the reset page. Called from a useState initializer, so it
 * is synchronous and nothing else (no effect, no router, no telemetry) can see
 * the token in the URL.
 *
 * Order: fragment, then query string (legacy links), then the stash the inline
 * script left behind.
 *
 * @param {{target?: object, location?: Location, history?: History, storage?: Storage}} [options]
 * @returns {string}
 */
export function takeResetToken(options = {}) {
  const target = options.target ?? (typeof window !== 'undefined' ? window : undefined);
  const loc = options.location ?? target?.location;
  const hist = options.history ?? target?.history;
  const storage = options.storage ?? target?.sessionStorage;
  const found =
    readTokenFromLocation(loc) ||
    readStashedToken(storage) ||
    String(target?.__gnbResetToken || '').trim();
  if (found) pendingToken = found; // a fresh token always wins
  const token = found || pendingToken || '';
  pendingToken = token;

  // The stash and the window copy go, and the address bar is clean.
  clearStashedToken(storage);
  try {
    delete target.__gnbResetToken;
  } catch {
    target.__gnbResetToken = undefined;
  }
  try {
    if (hist && typeof hist.replaceState === 'function') {
      hist.replaceState(hist.state, '', RESET_PATH);
    }
  } catch {
    // ignore
  }
  return token;
}

/**
 * Forget the token (the page calls this when it goes away).
 */
export function releaseResetToken() {
  pendingToken = null;
}

export default scrubResetToken;
