import { useMemo } from 'react';

/**
 * KPI totals and per-tab counts for the fuel comparison screen.
 *
 * Two different scopes live on this page and they are never mixed:
 *   - the tab counts come from the telematics sync status — the whole fuel audit
 *   - the litres totals come from the intervals loaded on screen
 * When the sync status is missing, every count is `null` (unknown) and never a
 * confident 0; the caller shows those as "—" with the reason beside them.
 */
const useComparisonMetrics = (records, status, { loaded = true } = {}) => {
  // Aggregate KPI Metrics
  const kpiMetrics = useMemo(() => {
    const rows = records || [];
    let totalBilled = 0;
    let totalTelematics = 0;

    rows.forEach((r) => {
      totalBilled += r.billFuelConsumed || 0;
      totalTelematics += r.fleetEdgeFuelConsumed || 0;
    });

    const auditClean =
      status?.completed != null && status?.flagged != null
        ? Math.max(0, status.completed - status.flagged)
        : null;

    return {
      // No intervals on screen means there is nothing to total — not zero litres.
      totalBilled: loaded && rows.length ? totalBilled : null,
      totalTelematics: loaded && rows.length ? totalTelematics : null,
      loadedCount: rows.length,
      flaggedCount: status?.flagged ?? null,
      cleanCount: auditClean,
      pendingCount: status?.needsAction ?? null,
    };
  }, [records, status, loaded]);

  // Tab counts — one source (the sync status), one window (the whole audit).
  const tabCounts = useMemo(
    () => ({
      all: status?.total ?? null,
      flagged: status?.flagged ?? null,
      review: status?.needsAction ?? null,
      clean:
        status?.completed != null && status?.flagged != null
          ? Math.max(0, status.completed - status.flagged)
          : null,
    }),
    [status],
  );

  return { kpiMetrics, tabCounts };
};

export default useComparisonMetrics;
