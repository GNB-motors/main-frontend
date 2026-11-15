import { formatInr, formatNumber } from '@/utils/redesign/format';
import './reportCardsReference.css';
import '../Vehicle360/panels/overview/referenceOverview.css';

export default function IdlingPeriodRead({
  live,
  history,
  loading,
  errors,
  truncated,
  onLive,
  onHistory,
}) {
  const liveReady = !loading && !errors['live idling'];
  const historyReady = !loading && !errors['idle history'];
  const hasNumber = (value) => value != null && value !== '' && Number.isFinite(Number(value));
  const excess = history.filter((row) => row.legitimacy === 'excess');
  const hours =
    historyReady && history.every((row) => hasNumber(row.durationMin))
      ? history.reduce((sum, row) => sum + Number(row.durationMin), 0) / 60
      : null;
  const cost =
    historyReady && excess.every((row) => hasNumber(row.rupees))
      ? excess.reduce((sum, row) => sum + Number(row.rupees), 0)
      : null;
  return (
    <section
      className="intel-assessment-briefing"
      aria-label="Idling period read"
      aria-busy={loading}
    >
      <div className="intel-assessment-brief-copy">
        <span>✧ Period read</span>
        <p>
          {loading ? (
            'Loading recorded idling activity…'
          ) : (
            <>
              {liveReady ? (
                <>
                  <button type="button" onClick={onLive}>
                    {formatNumber(live.length)} trucks are idling now
                  </button>
                  .{' '}
                </>
              ) : (
                'Live idling is unavailable. '
              )}
              {historyReady ? (
                <>
                  <button type="button" onClick={onHistory}>
                    {formatNumber(history.length)} closed idle events
                  </button>{' '}
                  are recorded in the selected period.
                </>
              ) : (
                'Idle history is unavailable.'
              )}
            </>
          )}
        </p>
        <small>
          Live activity shows the current position; closed events follow the selected dates.
          Excess-idling cost is an estimate from recorded events.
          {truncated
            ? ' Only the first 500 history records are loaded; period totals are incomplete.'
            : ''}
        </small>
      </div>
      <div className="intel-assessment-brief-kpis">
        {[
          [
            'Idling now',
            liveReady ? formatNumber(live.length) : '—',
            'Current live activity',
            onLive,
          ],
          [
            'Closed idle events',
            historyReady ? formatNumber(history.length) : '—',
            truncated ? 'Loaded records · incomplete' : 'Selected period',
            onHistory,
          ],
          [
            'Idle hours',
            hours == null ? '—' : `${formatNumber(hours, { digits: 1 })} h`,
            'Recorded closed events',
            onHistory,
          ],
          [
            'Excess idling',
            cost == null ? '—' : formatInr(cost),
            'Estimated cost · closed events',
            onHistory,
          ],
        ].map(([label, value, note, onClick]) => (
          <button type="button" key={label} onClick={onClick}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
