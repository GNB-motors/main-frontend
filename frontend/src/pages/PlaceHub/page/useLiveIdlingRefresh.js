import { useEffect, useRef } from 'react';
import PlaceHubService from '../PlaceHubService.js';
import { useVisibleInterval } from '../../../hooks/useVisibleInterval';

const LIVE_REFRESH_MS = 60_000;

export default function useLiveIdlingRefresh({ tab, allowIdling, setData }) {
  const controllerRef = useRef(null);

  // Leaving the tab also cancels a refresh still in flight.
  useEffect(() => {
    if (tab !== 'idling' || !allowIdling) return undefined;
    const controller = new AbortController();
    controllerRef.current = controller;
    return () => {
      controller.abort();
      controllerRef.current = null;
    };
  }, [tab, allowIdling]);

  // Live idling moves minute to minute; refresh it while someone is watching.
  // A tab nobody looks at is read again the moment it is looked at.
  useVisibleInterval(
    async () => {
      const controller = controllerRef.current;
      if (!controller || controller.signal.aborted) return;
      const live = await PlaceHubService.loadLiveIdling({ signal: controller.signal });
      if (!controller.signal.aborted && !live.error) setData((d) => ({ ...d, live: live.rows }));
    },
    LIVE_REFRESH_MS,
    { enabled: tab === 'idling' && !!allowIdling },
  );
}
