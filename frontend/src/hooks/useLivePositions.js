import { useEffect, useState } from 'react';

import useLiveData, { mergeByKey } from './useLiveData.js';
import { LiveTrackingService } from '../pages/LiveTracking/LiveTrackingService.jsx';
import { POLL_INTERVAL_MS } from '../pages/LiveTracking/liveTracking.shared.js';

/**
 * useLivePositions — one `positions` stream subscription with a silent
 * polling fallback (Workstream A, batch 6 follow-up).
 *
 *   const { positions, isLoading, error, lastEventAt, connectionState, refresh }
 *     = useLivePositions({ mapStreamRow: toGeofenceLiveVehicle, fallbackPollMs: 5000 });
 *
 * The base dataset comes from `initialFetch` (REST-first, §A.5); streamed
 * `positions` diffs are merged into it by registrationNumber. Streamed rows
 * pass through `mapStreamRow` first, so a page can keep its own row shape
 * (e.g. the geofence live-locations shape) while the stream speaks the
 * positions contract.
 *
 * Degraded fallback: the SSE client settles 'closed' when the backend stream
 * module is absent (ticket endpoint 404s, probed only every 5 minutes — never
 * hammered). In that state this hook silently resumes the old REST poll at
 * `fallbackPollMs` so the page keeps refreshing exactly as it did before the
 * migration. While the transport is connecting/open/reconnecting the stream
 * owns freshness and no poll runs.
 */
export function useLivePositions({
  enabled = true,
  initialFetch = () => LiveTrackingService.getPositions(),
  mapStreamRow = (row) => row,
  mergeKey = 'registrationNumber',
  fallbackPollMs = POLL_INTERVAL_MS,
} = {}) {
  const { data, status, error, connectionState, lastEventAt, refresh } = useLiveData('positions', {
    enabled,
    initialFetch,
    applyDiff: (current, changed) =>
      mergeByKey(current, (changed || []).map(mapStreamRow), mergeKey),
  });

  // The transport reports 'closed' both before its lazy chunk has loaded and
  // after it gave up — only the latter is a real degradation, so remember
  // that we at least saw it try before starting the fallback poll.
  const [sawStream, setSawStream] = useState(false);
  useEffect(() => {
    if (connectionState !== 'closed') setSawStream(true);
  }, [connectionState]);

  const degraded = sawStream && connectionState === 'closed';
  useEffect(() => {
    if (!enabled || !degraded) return undefined;
    const id = setInterval(() => {
      refresh();
    }, fallbackPollMs);
    return () => clearInterval(id);
  }, [enabled, degraded, fallbackPollMs, refresh]);

  return {
    positions: data ?? [],
    isLoading: status === 'loading',
    error,
    connectionState,
    lastEventAt,
    refresh,
  };
}

export default useLivePositions;
