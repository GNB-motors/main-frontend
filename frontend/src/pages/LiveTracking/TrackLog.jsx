import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { formatDuration, formatIst } from '../../utils/redesign/format';
import { buildTrackCsv, buildTripLog } from './trackPlayback';

/**
 * TrackLog — the trip log in the rail during Track mode.
 *
 * A plain list of what happened and when: the stops and the events. It
 * makes no judgement — it says where the truck stopped, for how long, and
 * what we worked out about the reason. The owner reads it and decides.
 */
export default function TrackLog({ track, onSeek = null }) {
  const stops = useMemo(() => (Array.isArray(track?.stops) ? track.stops : []), [track]);
  const events = useMemo(() => (Array.isArray(track?.events) ? track.events : []), [track]);
  const summary = track?.summary ?? null;

  const rows = useMemo(() => buildTripLog(stops, events), [stops, events]);

  const exportCsv = () => {
    const csv = buildTrackCsv(track);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'track-log.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="railview" aria-live="polite">
      <div className="railview--head">
        <div className="flex items-center justify-between gap-2">
          <h3 className="m-0 text-[15px] font-semibold text-[var(--rd-ink)]">Trip log</h3>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] px-2 py-1 text-[12px] font-medium text-[var(--rd-ink-2)] transition-colors hover:border-[var(--rd-line-strong)]"
          >
            <Download size={13} aria-hidden="true" />
            Export CSV
          </button>
        </div>
        {summary ? (
          <p className="m-0 mt-1 text-[12px] text-[var(--rd-ink-2)] tabular-nums">
            {summary.km} km · {formatDuration(summary.driveMin)} driving ·{' '}
            {formatDuration(summary.stopMin)} stopped
          </p>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="m-0 px-3 py-4 text-[13px] text-[var(--rd-ink-3)]">
          Nothing was recorded on this drive.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {rows.map((row) => (
            <li key={row.key}>
              <button
                type="button"
                onClick={() => onSeek?.(row.at)}
                className="flex w-full items-baseline gap-2 rounded-[var(--rd-radius-xs)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--rd-card-2)]"
              >
                <span className="shrink-0 text-[12px] text-[var(--rd-ink-3)] tabular-nums">
                  {formatIst(row.at)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-[var(--rd-ink)]">{row.title}</span>
                  {row.text ? (
                    <span className="block truncate text-[12px] text-[var(--rd-ink-3)]">{row.text}</span>
                  ) : null}
                </span>
                {row.durationMin != null ? (
                  <span className="shrink-0 text-[12px] text-[var(--rd-ink-2)] tabular-nums">
                    {formatDuration(row.durationMin)}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
