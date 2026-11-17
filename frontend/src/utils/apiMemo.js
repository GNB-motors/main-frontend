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
 */
const MAX_ENTRIES = 200;
const store = new Map(); // key -> { data, at, scope }

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
  if (entry.scope !== currentScope() || now - entry.at > maxAgeMs) {
    store.delete(key);
    return undefined;
  }
  // Refresh recency.
  store.delete(key);
  store.set(key, entry);
  return entry.data;
}

function set(key, data, now = Date.now()) {
  if (!getToken()) return;
  if (store.has(key)) store.delete(key);
  while (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value);
  store.set(key, { data, at: now, scope: currentScope() });
}

const apiMemo = {
  get,
  set,
  clear: () => store.clear(),
  get size() {
    return store.size;
  },
  /** 5 min for today's answers, 30 min for a past day's (the server's own cache windows). */
  ttlFor: (day, today) => (day === today ? 5 * 60 * 1000 : 30 * 60 * 1000),
};

export default apiMemo;
