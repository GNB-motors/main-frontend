import { useEffect, useRef, useState } from 'react';
import FleetLinkHealthService from '../services/FleetLinkHealthService';
import { recoveredAccounts } from '../lib/fleetLink';
import { useVisibleInterval } from './useVisibleInterval';

const POLL_MS = 5 * 60 * 1000;
// After "I've reconnected", poll fast for a while so the panel turns green
// within seconds of the extension finishing the link.
const FAST_POLL_MS = 15 * 1000;
const FAST_WINDOW_MS = 2 * 60 * 1000;
const MIN_REFOCUS_GAP_MS = 30 * 1000;

const EMPTY = { data: null, error: null };

/**
 * FleetEdge link health for the active branch, polled every 5 min while
 * `enabled` and while the tab is visible, re-read when the tab comes back into
 * view, and every 15 s for two minutes after `checkAgain()`. A failed poll
 * keeps the last payload — a network blip must not hide a known dead link.
 * `onRecovered(accounts)` fires when an account stops needing action between
 * two polls.
 */
export default function useFleetLinkHealth(enabled, branchId, { onRecovered } = {}) {
  const [state, setState] = useState(EMPTY);
  const [fastUntil, setFastUntil] = useState(0);
  const pollRef = useRef(null);
  const lastPollAtRef = useRef(0);
  const onRecoveredRef = useRef(onRecovered);
  onRecoveredRef.current = onRecovered;

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY);
      return undefined;
    }
    let controller = null;
    // Per branch: a recovery is only a recovery within the same scope.
    let previous = null;

    const poll = async () => {
      controller?.abort();
      controller = new AbortController();
      const { signal } = controller;
      lastPollAtRef.current = Date.now();
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
    return () => {
      controller?.abort();
      pollRef.current = null;
    };
  }, [enabled, branchId]);

  // The poll only runs while the tab is looked at: a tab nobody looks at does
  // not need its link health read, and it is read the moment it is looked at.
  useVisibleInterval(
    () => {
      if (fastUntil) {
        // The fast window is over.
        if (Date.now() >= fastUntil) {
          setFastUntil(0);
          return;
        }
        pollRef.current?.();
        return;
      }
      // A read that just happened is not repeated: the tab can come back into
      // view right after a poll.
      if (Date.now() - lastPollAtRef.current <= MIN_REFOCUS_GAP_MS) return;
      pollRef.current?.();
    },
    fastUntil ? FAST_POLL_MS : POLL_MS,
    { enabled: !!enabled },
  );

  const refresh = () => pollRef.current?.();
  const checkAgain = () => {
    pollRef.current?.();
    setFastUntil(Date.now() + FAST_WINDOW_MS);
  };

  return { data: state.data, error: state.error, checking: fastUntil > 0, refresh, checkAgain };
}
