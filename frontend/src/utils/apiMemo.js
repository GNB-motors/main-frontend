import { getBranchId, getOrgId, getToken, getUserId } from './session';

/**
 * In-memory answers of read-only API calls, so returning to a page inside a
 * short window shows the last answer without asking the server again.
 *
 * Invariants:
 *  - An entry belongs to the user, org and branch that read it. A read under
 *    any other one (an account or branch switch) is a miss, and once nobody
 *    is signed in the whole store is dropped: one account never sees
 *    another's answers.
 *  - It lives in this tab's memory only — never in browser storage, never in
 *    the HTTP cache (which keys by URL, not by who asked). A reload starts
 *    empty.
 *  - Bounded: past MAX_ENTRIES the least recently used entry goes.
 *  - A stale answer is kept (not shown) so a conditional request can still be
 *    answered with 304 and that copy reused.
 */
const MAX_ENTRIES = 200;
const store = new Map(); // key -> { data, at, scope, etag }

function currentScope() {
  return `${getUserId() || ''}|${getOrgId() || ''}|${getBranchId() || ''}`;
}

/** The answer kept for `key`, if read under this scope less than `maxAgeMs` ago. */
function get(key, maxAgeMs, now = Date.now()) {
  if (!getToken()) {
    store.clear();
    return undefined;
  }
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.scope !== currentScope()) {
    store.delete(key);
    return undefined;
  }
  if (now - entry.at > maxAgeMs) {
    // Stale: not shown, but kept — a conditional request (If-None-Match) can
    // still be answered with 304 and this copy reused.
    return undefined;
  }
  // Refresh recency.
  store.delete(key);
  store.set(key, entry);
  return entry.data;
}

/** The kept answer with what the server said about it (its ETag). */
function getEntry(key, maxAgeMs, now = Date.now()) {
  const entry = get(key, maxAgeMs, now);
  if (entry === undefined) return undefined;
  const kept = store.get(key);
  return { data: entry, at: kept?.at ?? now, etag: kept?.etag ?? null };
}

function setWithEtag(key, data, etag, now = Date.now(), scope = currentScope()) {
  if (!getToken()) return;
  // An answer read under another session (logout / org switch mid-request) is never kept.
  if (scope !== currentScope()) return;
  if (store.has(key)) store.delete(key);
  while (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value);
  store.set(key, { data, at: now, scope, etag: etag ?? null });
}

function set(key, data, now = Date.now()) {
  if (!getToken()) return;
  // An answer written without a tag keeps the tag it was read with: the
  // server still recognises it.
  const previous = store.get(key);
  const etag = previous && previous.scope === currentScope() ? (previous.etag ?? null) : null;
  setWithEtag(key, data, etag, now);
}

/**
 * Ask the server whether the answer we hold is still the one it would send.
 *
 * `request(etag)` answers `{ data, etag }` for a new answer, or
 * `{ notModified: true }` when the server says ours is still current (304).
 * A 304 keeps the answer we hold and refreshes its timestamp, so a page that
 * comes back after the window shows the same numbers without the server
 * rebuilding them.
 */
async function revalidate(key, request) {
  if (!getToken()) store.clear();
  const scope = currentScope();
  const entry = store.get(key);
  const etag = entry && entry.scope === scope ? (entry.etag ?? null) : null;
  const now = Date.now();
  if (!etag) {
    const answer = await request(null);
    setWithEtag(key, answer.data, answer.etag, now, scope);
    return answer.data;
  }
  const answer = await request(etag);
  if (answer?.notModified) {
    if (!entry) {
      // The server says we have it, but we do not: ask for the body.
      const full = await request(null);
      setWithEtag(key, full.data, full.etag, now, scope);
      return full.data;
    }
    store.delete(key);
    store.set(key, { ...entry, at: now });
    return entry.data;
  }
  setWithEtag(key, answer.data, answer.etag, now, scope);
  return answer.data;
}

const apiMemo = {
  get,
  getEntry,
  set,
  setWithEtag,
  revalidate,
  currentScope,
  clear: () => store.clear(),
  get size() {
    return store.size;
  },
  /** 5 min for today's answers, 30 min for a past day's (the server's own cache windows). */
  ttlFor: (day, today) => (day === today ? 5 * 60 * 1000 : 30 * 60 * 1000),
};

export default apiMemo;
