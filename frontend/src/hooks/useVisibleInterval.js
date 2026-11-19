import { useEffect, useRef } from 'react';

/**
 * useVisibleInterval — a timer that only runs while the tab is visible.
 *
 *   useVisibleInterval(() => refresh(), 30_000);
 *
 * A hidden tab shows nobody the data it would poll for, and the server does
 * that work for nothing. So the timer pauses while the tab is hidden, and the
 * callback runs once — immediately — when the tab comes back: the page is
 * current again without waiting a whole interval.
 *
 * The callback is held in a ref, so a new function on every render does not
 * restart the timer. `enabled: false` keeps the hook completely idle.
 */
export function useVisibleInterval(fn, ms, { enabled = true } = {}) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined;

    const stop = () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const start = () => {
      stop();
      if (document.visibilityState !== 'visible') return;
      timerRef.current = setInterval(() => fnRef.current(), ms);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        stop();
        return;
      }
      // The tab is back: read once now, then the cadence starts again.
      fnRef.current();
      start();
    };

    start();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, ms]);

  return null;
}

export default useVisibleInterval;
