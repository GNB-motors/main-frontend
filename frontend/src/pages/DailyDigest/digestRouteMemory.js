import { getPref, removePref, setPref } from '../../utils/session';

/**
 * Whether this server lacks GET /api/fleet-view/digest (it answered 404).
 *
 * Remembered for a few hours so the page does not wait for the same 404 on
 * every visit before it can start the release digest's requests. Kept short
 * so a deploy that adds the route is picked up the same day. When storage is
 * blocked the session helpers answer null and the page simply asks again.
 */
const KEY = 'gnb.digest.routeMissingAt';
const REMEMBER_MS = 6 * 60 * 60 * 1000;

let missingAt = null;

function forget() {
  missingAt = null;
  removePref(KEY);
}

function knownMissing(now = Date.now()) {
  const stored = Number(getPref(KEY));
  const at = missingAt ?? (Number.isFinite(stored) && stored > 0 ? stored : null);
  if (at == null) return false;
  if (now - at > REMEMBER_MS) {
    forget();
    return false;
  }
  missingAt = at;
  return true;
}

function remember(now = Date.now()) {
  missingAt = now;
  setPref(KEY, String(now));
}

const digestRouteMemory = { knownMissing, remember, forget, REMEMBER_MS };

export default digestRouteMemory;
