import { formatDateTimeIST, formatInIST } from '../../utils/dateUtils';
import { defFreshness, FRESHNESS_LABEL } from './defLedgerFormat';

export default function DataFreshness({ vehicle }) {
  const { status, asOf } = defFreshness(vehicle);
  const stale = status === 'STALE';
  return (
    <div className="flex flex-col items-start gap-1 text-[11px]">
      {asOf ? (
        <span className="whitespace-nowrap text-slate-600 dark:text-slate-400">
          Data as of{' '}
          <time dateTime={new Date(asOf).toISOString()} title={`${formatDateTimeIST(asOf)} IST`}>
            {formatInIST(asOf, 'D MMM YYYY')}
          </time>
        </span>
      ) : status !== 'NO_DATA' ? (
        <span className="text-slate-500">Telemetry date unavailable</span>
      ) : null}
      <span
        className={`inline-flex rounded px-1.5 py-0.5 font-semibold ${
          stale
            ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
        }`}
        title={
          stale
            ? 'Telemetry is out of date. The figures reflect the data-as-of timestamp.'
            : 'Freshness is based on telemetry coverage, independently of calculation time.'
        }
      >
        {FRESHNESS_LABEL[status]}
      </span>
    </div>
  );
}
