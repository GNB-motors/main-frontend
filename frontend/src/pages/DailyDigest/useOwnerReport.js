import useApi from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';

/** The morning brief (₹ leaks) and the eight-section owner report for one day. */
export default function useOwnerReport(day) {
  const brief$ = useApi((signal) => fleetViewService.getMorningBrief({ date: day, signal }), [day]);
  const report$ = useApi((signal) => fleetViewService.getOwnerReport({ day, signal }), [day]);
  return { brief$, report$ };
}
