/**
 * The GNB Edge Chrome extension, as the web app sees it. The extension answers
 * one external message, PING → { ok, version }, and only for origins listed in
 * its manifest's externally_connectable (app.gnbedge.in and the Vercel preview).
 */

export const EXTENSION_ID = 'nkcdcfebmemgkjkgbdiioalkpgejanln';
export const STORE_URL = `https://chromewebstore.google.com/detail/gnbedge/${EXTENSION_ID}`;
export const FLEETEDGE_URL = 'https://fleetedge.home.tatamotors/';

const PING_TIMEOUT_MS = 1500;

/** Re-linking happens in desktop Chrome: the extension does not run on phones. */
export function isDesktopChrome() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  return !mobile && typeof chrome !== 'undefined' && Boolean(chrome?.runtime);
}

/**
 * Resolves 'installed' when the extension answers, 'unknown' otherwise. A
 * silent extension is not proof it is missing (an origin outside
 * externally_connectable gets no answer either), so callers should offer the
 * install link without claiming it is absent.
 *
 * @returns {Promise<'installed'|'unknown'>}
 */
export function pingExtension(timeoutMs = PING_TIMEOUT_MS) {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome?.runtime?.sendMessage) {
      resolve('unknown');
      return;
    }
    const timer = setTimeout(() => resolve('unknown'), timeoutMs);
    try {
      chrome.runtime.sendMessage(EXTENSION_ID, { type: 'PING' }, (response) => {
        clearTimeout(timer);
        // Reading lastError is what stops Chrome logging it as unchecked.
        const failed = Boolean(chrome.runtime.lastError);
        resolve(!failed && response?.ok ? 'installed' : 'unknown');
      });
    } catch {
      // Non-Chromium browsers throw on the extension-id overload.
      clearTimeout(timer);
      resolve('unknown');
    }
  });
}
