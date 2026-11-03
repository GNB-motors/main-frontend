import { useLiveData } from './useLiveData';

const keyOf = (row) => row?.id ?? row?._id ?? null;

/** Merge a pushed alert into the list we already hold. */
function mergeAlerts(current, pushed) {
  const rows = Array.isArray(pushed) ? pushed : pushed?.items;
  if (!Array.isArray(rows)) return current;
  const next = current.slice();
  const index = new Map(next.map((row, i) => [keyOf(row), i]));
  for (const row of rows) {
    const key = keyOf(row);
    if (key == null) continue;
    if (index.has(key)) next[index.get(key)] = row;
    else {
      index.set(key, next.length);
      next.push(row);
    }
  }
  return next;
}

/**
 * useLiveAlerts — the alerts of the last day, straight off the live stream.
 *
 * The stream sends the recent window, so the list is merged by id and the
 * badge on each truck counts only what nobody has acknowledged.
 */
export function useLiveAlerts({ enabled = true } = {}) {
  const { data, status, error, lastEventAt, refresh } = useLiveData('alerts', {
    enabled,
    initialFetch: async () => [],
    applyDiff: (current, payload) => mergeAlerts(current ?? [], payload),
  });

  return {
    alerts: data ?? [],
    isLoading: status === 'loading',
    error,
    lastEventAt,
    refresh,
  };
}

export default useLiveAlerts;
