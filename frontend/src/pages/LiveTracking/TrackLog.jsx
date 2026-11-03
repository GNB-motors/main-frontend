import { useMemo } from 'react';
import { formatDuration, formatIst } from '../../utils/redesign/format';
import { buildTripLog } from './trackPlayback';

/** A dot colour for each kind of log row, matching the timeline. */
function kindColor(kind) {
  switch (kind) {
    case 'OVERSPEED':
      return 'var(--rd-overspeed)';
    case 'DETOUR':
      return 'var(--rd-detour)';
    case 'FUEL_FILL':
      return 'var(--rd-leg-loaded)';
    case 'FUEL_DROP':
      return 'var(--rd-leg-reposition)';
    case 'STOP':
      return 'var(--rd-stopped)';
    default:
      return 'var(--rd-ink-3)';
  }
}

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

  return (
    <div className="railview track-log" aria-live="polite">
      <div className="track-log-header">
        <h3 className="track-log-title">Trip log</h3>
        {summary ? (
          <dl className="track-log-summary">
            <div>
              <dt>Distance</dt>
              <dd>
                {summary.km} <span>km</span>
              </dd>
            </div>
            <div>
              <dt>Driving</dt>
              <dd>{formatDuration(summary.driveMin)}</dd>
            </div>
            <div>
              <dt>Stopped</dt>
              <dd>{formatDuration(summary.stopMin)}</dd>
            </div>
          </dl>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="track-log-message">Nothing was recorded on this drive.</p>
      ) : (
        <ul className="track-log-list">
          {rows.map((row) => (
            <li key={row.key} className="track-log-item">
              <button type="button" onClick={() => onSeek?.(row.at)} className="track-log-row">
                <span
                  aria-hidden="true"
                  className="track-log-dot"
                  style={{ backgroundColor: kindColor(row.kind) }}
                />
                <span className="track-log-content">
                  <span className="track-log-name">{row.title}</span>
                  <span className="track-log-time">{formatIst(row.at)}</span>
                  {row.text ? <span className="track-log-detail">{row.text}</span> : null}
                </span>
                {row.durationMin != null ? (
                  <span className="track-log-duration">{formatDuration(row.durationMin)}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
