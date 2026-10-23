import { useMemo } from 'react';

/** KPI totals over the loaded records and the per-tab counts from the sync status. */
const useComparisonMetrics = (records, status, total) => {
  // Aggregate KPI Metrics
  const kpiMetrics = useMemo(() => {
    let totalBilled = 0;
    let totalTelematics = 0;
    let flaggedCount = status?.flagged ?? 0;
    let cleanCount =
      status?.completed != null && status?.flagged != null
        ? Math.max(0, status.completed - status.flagged)
        : 0;
    let pendingCount = status?.needsAction ?? 0;

    records.forEach((r) => {
      totalBilled += r.billFuelConsumed || 0;
      totalTelematics += r.fleetEdgeFuelConsumed || 0;
      if (!r.isFlagged && r.status === 'COMPLETED') cleanCount += 1;
    });

    return {
      totalBilled,
      totalTelematics,
      flaggedCount,
      cleanCount,
      pendingCount,
    };
  }, [records, status]);

  // Tab counts
  const tabCounts = useMemo(
    () => ({
      all: status?.total ?? total,
      flagged: status?.flagged ?? 0,
      review: status?.needsAction ?? 0,
      clean:
        status?.completed != null && status?.flagged != null
          ? Math.max(0, status.completed - status.flagged)
          : null,
    }),
    [status, total],
  );

  return { kpiMetrics, tabCounts };
};

export default useComparisonMetrics;
