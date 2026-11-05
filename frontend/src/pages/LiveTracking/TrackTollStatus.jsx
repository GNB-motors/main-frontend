import { replayTolls, tollCoverageText, tollChipText } from './trackTollsModel';

/**
 * The toll status of a drive.
 *
 * On the map it was a floating card that covered the top-right of the map for
 * the whole drive. It is now a small chip in the replay bar's summary line,
 * where the owner reads the rest of the drive — and it never covers the map.
 */
export default function TrackTollStatus({ data, loading, error, onRetry, playheadTime, compact = false }) {
  const markers = replayTolls(data?.passes, playheadTime);
  const passed = markers
    .filter((pass) => pass.passed)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const latest = passed[0];
  const coverage = tollCoverageText(data, { loading, error });

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--rd-line)] px-2 py-0.5 text-[11px] text-[var(--rd-ink-3)]"
        aria-label="Toll crossings"
      >
        <span>{tollChipText(data, { loading, error, passed: passed.length, total: markers.length })}</span>
        {error ? (
          <button
            type="button"
            className="font-semibold text-[var(--rd-brand-2)] underline"
            onClick={onRetry}
          >
            Retry
          </button>
        ) : null}
      </span>
    );
  }

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm"
      aria-label="Replay toll crossings"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <strong>
          Tolls{markers.length ? ` · ${passed.length}/${markers.length} reached` : ''}
        </strong>
        {latest ? (
          <span>
            {latest.name || 'Toll booth'} · {latest.action.toLowerCase()} ·{' '}
            {new Date(latest.at).toLocaleTimeString('en-IN', {
              timeZone: 'Asia/Kolkata',
              hour: 'numeric',
              minute: '2-digit',
            })}{' '}
            IST
          </span>
        ) : null}
        {coverage ? <span role="status">{coverage}</span> : null}
        {error ? (
          <button type="button" className="font-semibold text-blue-700 underline" onClick={onRetry}>
            Retry tolls
          </button>
        ) : null}
      </div>
    </div>
  );
}
