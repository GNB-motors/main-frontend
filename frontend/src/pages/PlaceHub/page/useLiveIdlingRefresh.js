import { useEffect } from 'react';
import PlaceHubService from '../PlaceHubService.js';

const LIVE_REFRESH_MS = 60_000;

export default function useLiveIdlingRefresh({ tab, allowIdling, setData }) {
  // Live idling moves minute to minute; refresh it while someone is watching.
  useEffect(() => {
    if (tab !== 'idling' || !allowIdling) return undefined;
    // Leaving the tab also cancels a refresh still in flight.
    const controller = new AbortController();
    const timer = setInterval(async () => {
      const live = await PlaceHubService.loadLiveIdling({ signal: controller.signal });
      if (!controller.signal.aborted && !live.error) setData((d) => ({ ...d, live: live.rows }));
    }, LIVE_REFRESH_MS);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [tab, allowIdling, setData]);
}
