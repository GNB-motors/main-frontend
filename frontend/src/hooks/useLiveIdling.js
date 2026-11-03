import { useEffect } from 'react';
import { useLiveData } from './useLiveData';
import IdlingConsoleService from '../pages/IdlingConsole/IdlingConsoleService';

/**
 * How often the idling console is read while the Track page is open.
 * The console is live; a minute is fresh enough for a chip and cheap enough
 * to keep running.
 */
export const IDLING_POLL_MS = 60 * 1000;

const keyOf = (row) => row?._id ?? row?.id ?? row?.registrationNumber ?? null;

/** Merge a pushed row into the list we already hold. */
function mergeRows(current, pushed) {
  const rows = Array.isArray(pushed) ? pushed : pushed?.items;
  if (!Array.isArray(rows)) return current;
  const next = current.slice();
  const index = new Map(next.map((row, i) => [keyOf(row), i]));
  const ended = new Set();
  for (const row of rows) {
    const key = keyOf(row);
    if (key == null) continue;
    // A pushed row whose stop has ended is no longer idling: drop it.
    if (row.endAt) {
      ended.add(key);
      continue;
    }
    if (index.has(key)) next[index.get(key)] = row;
    else {
      index.set(key, next.length);
      next.push(row);
    }
  }
  return ended.size ? next.filter((row) => !ended.has(keyOf(row))) : next;
}

/**
 * useLiveIdling — the trucks that are idling right now.
 *
 * The live stream pushes idling events; the console endpoint is read every
 * minute so the minutes on the chip keep moving even when the stream is quiet.
 */
export function useLiveIdling({ enabled = true, pollMs = IDLING_POLL_MS } = {}) {
  const { data, status, error, lastEventAt, refresh } = useLiveData('idling', {
    enabled,
    initialFetch: (signal) => IdlingConsoleService.getLive({ signal }),
    applyDiff: (current, payload) => mergeRows(current ?? [], payload),
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setInterval(() => {
      refresh();
    }, pollMs);
    return () => clearInterval(timer);
  }, [enabled, pollMs, refresh]);

  return {
    idling: data ?? [],
    isLoading: status === 'loading',
    error,
    lastEventAt,
    refresh,
  };
}

export default useLiveIdling;
