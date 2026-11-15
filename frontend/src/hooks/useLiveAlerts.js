import { useLiveData } from './useLiveData';
import { OwnerAlertsService } from '../pages/OwnerAlerts/OwnerAlertsService';

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

const DAY_MS = 24 * 60 * 60 * 1000;

/** The unacknowledged alerts of the last 24 h (the feed's page cap is 100). */
export async function loadOpenAlerts(signal, now = Date.now()) {
  try {
    const data = await OwnerAlertsService.getAlerts(
      { acknowledged: false, from: new Date(now - DAY_MS).toISOString(), limit: 100 },
      signal,
    );
    return Array.isArray(data?.records) ? data.records : [];
  } catch (error) {
    if (error?.code === 'ERR_CANCELED') throw error;
    return [];
  }
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
    // The stream only sends alerts newer than its cursor, so the open alerts of
    // the last day are read once on load; a user the feed refuses (role or
    // flag) simply starts with none, and the stream still adds new ones.
    initialFetch: (signal) => loadOpenAlerts(signal),
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
