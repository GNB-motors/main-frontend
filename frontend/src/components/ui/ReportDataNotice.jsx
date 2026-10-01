import { AlertTriangle, Clock } from 'lucide-react';
import { reportDataAge, daysAgoLabel } from '../../lib/reportFreshness';
import { formatDateIST } from '../../utils/dateUtils';
import './ReportDataNotice.css';

/**
 * ReportDataNotice — states how far behind a report's data is.
 *
 * Reports are built from records people enter by hand, which can stop
 * arriving silently. A stale "latest record" date is a warning, not a footnote,
 * so nobody reads months-old numbers as this week's.
 *
 *   <ReportDataNotice dataAsOf={meta.dataAsOf} label="Latest fuel bill"
 *     staleHint="Bills logged after this date are not in this report." />
 */
export default function ReportDataNotice({
  dataAsOf,
  label = 'Latest record',
  emptyText = 'No records found yet.',
  staleHint = null,
}) {
  const { level, days } = reportDataAge(dataAsOf);

  if (level === 'none') {
    return (
      <div className="rdn rdn--none" role="status">
        <AlertTriangle size={14} aria-hidden="true" />
        <span>{emptyText}</span>
      </div>
    );
  }

  const Icon = level === 'stale' ? AlertTriangle : Clock;
  return (
    <div className={`rdn rdn--${level}`} role="status">
      <Icon size={14} aria-hidden="true" />
      <span>
        {label}: <strong>{formatDateIST(dataAsOf)}</strong> ({daysAgoLabel(days)})
      </span>
      {level === 'stale' && staleHint ? <span className="rdn-hint">{staleHint}</span> : null}
    </div>
  );
}
