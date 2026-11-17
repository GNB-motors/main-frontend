import useApi from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';

/**
 * The morning brief (₹ leaks) and the eight-section owner report for one day.
 * `fresh()` is read as each request is built: true only while Refresh runs.
 * `cacheMs` > 0 answers a revisit inside that window from this tab's memory.
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
    { scopeKey: day, cacheKey: `ownerReport:${day}`, cacheMs },
  );
  return { brief$, report$ };
}
