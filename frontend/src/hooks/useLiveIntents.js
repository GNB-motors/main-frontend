import { useLiveData } from './useLiveData';
import { LiveTrackingService } from '../pages/LiveTracking/LiveTrackingService';

const keyOf = (row) => row?.registrationNumber ?? row?._id ?? row?.id ?? null;

/** Merge a pushed intent into the list we already hold. */
function mergeIntents(current, pushed) {
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
 * useLiveIntents — where each truck is likely headed.
 *
 * The predictions are read once and then kept fresh by the live stream. A
 * truck with no prediction simply has no row: it is never "unknown".
 */
export function useLiveIntents({ enabled = true } = {}) {
  const { data, status, error, lastEventAt, refresh } = useLiveData('intent', {
    enabled,
    initialFetch: (signal) => LiveTrackingService.getIntents({ signal }),
    applyDiff: (current, payload) => mergeIntents(current ?? [], payload),
  });

  return {
    intents: data ?? [],
    isLoading: status === 'loading',
    error,
    lastEventAt,
    refresh,
  };
}

export default useLiveIntents;
