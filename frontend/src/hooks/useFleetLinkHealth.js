import { useEffect, useRef, useState } from 'react';
import FleetLinkHealthService from '../services/FleetLinkHealthService';
import { recoveredAccounts } from '../lib/fleetLink';

const POLL_MS = 5 * 60 * 1000;
// After "I've reconnected", poll fast for a while so the panel turns green
// within seconds of the extension finishing the link.
const FAST_POLL_MS = 15 * 1000;
const FAST_WINDOW_MS = 2 * 60 * 1000;
const MIN_REFOCUS_GAP_MS = 30 * 1000;

const EMPTY = { data: null, error: null };

/**
 * FleetEdge link health for the active branch, polled every 5 min while
 * `enabled`, re-read when the tab comes back into view, and every 15 s for two
 * minutes after `checkAgain()`. A failed poll keeps the last payload — a
 * network blip must not hide a known dead link. `onRecovered(accounts)` fires
 * when an account stops needing action between two polls.
 */
export default function useFleetLinkHealth(enabled, branchId, { onRecovered } = {}) {
  const [state, setState] = useState(EMPTY);
  const [fastUntil, setFastUntil] = useState(0);
  const pollRef = useRef(null);
  const onRecoveredRef = useRef(onRecovered);
  onRecoveredRef.current = onRecovered;

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY);
      return undefined;
    }
    let controller = null;
    let lastPollAt = 0;
    // Per branch: a recovery is only a recovery within the same scope.
    let previous = null;

    const poll = async () => {
      controller?.abort();
      controller = new AbortController();
      const { signal } = controller;
      lastPollAt = Date.now();
      try {
        const data = await FleetLinkHealthService.getLinkHealth({ signal });
        if (signal.aborted) return;
        const recovered = recoveredAccounts(previous, data);
        previous = data;
        setState({ data, error: null });
        if (data?.severity === 'none') setFastUntil(0);
        if (recovered.length) onRecoveredRef.current?.(recovered);
      } catch (error) {
        if (signal.aborted || error?.code === 'ERR_CANCELED') return;
        setState((s) => ({ ...s, error }));
      }
    };
    pollRef.current = poll;

    poll();
    const interval = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastPollAt > MIN_REFOCUS_GAP_MS) {
        poll();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      controller?.abort();
      pollRef.current = null;
    };
  }, [enabled, branchId]);

  useEffect(() => {
    if (!enabled || !fastUntil) return undefined;
    const interval = setInterval(() => {
      if (Date.now() >= fastUntil) setFastUntil(0);
      else pollRef.current?.();
    }, FAST_POLL_MS);
    return () => clearInterval(interval);
  }, [enabled, fastUntil]);

  const refresh = () => pollRef.current?.();
  const checkAgain = () => {
    pollRef.current?.();
    setFastUntil(Date.now() + FAST_WINDOW_MS);
  };

  return { data: state.data, error: state.error, checking: fastUntil > 0, refresh, checkAgain };
}
