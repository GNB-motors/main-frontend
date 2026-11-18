import { useEffect, useRef } from 'react';
import { useLiveData } from './useLiveData';
import IdlingConsoleService from '../pages/IdlingConsole/IdlingConsoleService';

/**
 * How often the idling console is read while the Track page is open.
 * The console is live; a minute is fresh enough for a chip and cheap enough
 * to keep running.
 */
export const IDLING_POLL_MS = 60 * 1000;

/**
 * How often the console is read while the stream is connected.
 *
 * The pushes carry the rows, but the minutes on the chip are computed
 * server-side, so a stream that stays 'open' without events (a half-open
 * socket) would freeze them for ever. The slow poll is the safety net: it
 * keeps the minutes moving without asking for what the pushes already sent.
 */
export const IDLING_OPEN_POLL_MS = 180 * 1000;

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
 * While the stream is connected the poll slows down (the pushes already carry
 * the same rows) but it never stops: a socket that says 'open' and sends
 * nothing would otherwise freeze the minutes for ever.
 */
export function useLiveIdling({
  enabled = true,
  pollMs = IDLING_POLL_MS,
  openPollMs = IDLING_OPEN_POLL_MS,
} = {}) {
  const { data, status, error, lastEventAt, refresh, connectionState } = useLiveData('idling', {
    enabled,
    initialFetch: (signal) => IdlingConsoleService.getLive({ signal }),
    applyDiff: (current, payload) => mergeRows(current ?? [], payload),
  });

  // Whether the stream was open the last time we acted on it: the first open
  // is a read, the later ones are not (the poll already covers them).
  const wasOpenRef = useRef(connectionState === 'open');

  useEffect(() => {
    if (!enabled) return undefined;
    const open = connectionState === 'open';
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;
    // The stream just opened: read now, so the chips are fresh without
    // waiting for the first push.
    if (open && !wasOpen) refresh();
    // The poll never stops: with the stream open it is slow, without it the
    // stream is not carrying the feed and the read is the only refresh.
    const timer = setInterval(
      () => {
        refresh();
      },
      open ? openPollMs : pollMs,
    );
    return () => clearInterval(timer);
  }, [enabled, pollMs, openPollMs, refresh, connectionState]);

  // A tab that was in the background keeps its minutes stale: read on the way
  // back in.
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined;
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [enabled, refresh]);

  return {
    idling: data ?? [],
    isLoading: status === 'loading',
    error,
    lastEventAt,
    refresh,
  };
}

export default useLiveIdling;
