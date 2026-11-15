import { useLiveData } from './useLiveData';

const keyOf = (row) => row?._id ?? row?.id ?? null;

/** Merge a pushed incident into the list we already hold. */
function mergeIncidents(current, pushed) {
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
 * useLiveIncidents — the incidents the fleet reports.
 *
 * The incident feed arrives over the live stream. There is no list endpoint
 * yet, so the base read is empty and the stream fills it.
 */
export function useLiveIncidents({ enabled = true } = {}) {
  const { data, status, error, lastEventAt, refresh } = useLiveData('incidents', {
    enabled,
    initialFetch: async () => [],
    applyDiff: (current, payload) => mergeIncidents(current ?? [], payload),
  });

  return {
    incidents: data ?? [],
    isLoading: status === 'loading',
    error,
    lastEventAt,
    refresh,
  };
}

export default useLiveIncidents;
