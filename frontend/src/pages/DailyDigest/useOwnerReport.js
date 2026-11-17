import useApi from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';

/**
 * The morning brief (₹ leaks) and the eight-section owner report for one day.
 * `fresh()` is read as each request is built: true only while Refresh runs.
 * `cacheMs` keeps the morning brief in tab memory. The owner report is read
 * again on a revisit so open queues are current even for a historical day;
 * its other seven sections retain their existing server-side cache.
 */
export default function useOwnerReport(day, fresh = () => undefined, cacheMs = 0) {
  const brief$ = useApi(
    (signal) => fleetViewService.getMorningBrief({ date: day, fresh: fresh(), signal }),
    [day],
    { scopeKey: day, cacheKey: `morningBrief:${day}`, cacheMs },
  );
  const report$ = useApi(
    (signal) => fleetViewService.getOwnerReport({ day, fresh: fresh(), signal }),
    [day],
    { scopeKey: day },
  );
  return { brief$, report$ };
}
