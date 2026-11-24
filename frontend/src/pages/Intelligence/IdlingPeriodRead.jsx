import { toISTDateString } from '../../utils/dateUtils';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatInr, formatNumber } from '@/utils/redesign/format';
import './reportCardsReference.css';
import '../Vehicle360/panels/overview/referenceOverview.css';

export default function IdlingPeriodRead({
  live,
  history,
  open = [],
  loading,
  errors,
  truncated,
  onLive,
  onHistory,
}) {
  const liveReady = !loading && !errors['live idling'] && !errors['driver assignments'];
  const historyReady = !loading && !errors['idle history'] && !errors['driver assignments'];
  const hasNumber = (value) => value != null && value !== '' && Number.isFinite(Number(value));
  const excess = history.filter((row) => row.legitimacy === 'excess');
  // Finished stops plus the ones still running that started in the period:
  // the same stops the idle-moments log lists, so the two counts agree.
  const stops = historyReady && liveReady ? [...history, ...open] : history;
  const runningKnown = historyReady && liveReady;
  const hours =
    historyReady && stops.every((row) => hasNumber(row.durationMin))
      ? stops.reduce((sum, row) => sum + Number(row.durationMin), 0) / 60
      : null;
  const cost =
    historyReady && excess.every((row) => hasNumber(row.rupees))
      ? excess.reduce((sum, row) => sum + Number(row.rupees), 0)
      : null;
  const truckHours = new Map();
  const dayHours = new Map();
  if (historyReady) {
    for (const row of stops) {
      if (!hasNumber(row.durationMin) || Number(row.durationMin) < 0) continue;
      const duration = Number(row.durationMin) / 60;
      const truck = row.registrationNumber;
      const day = row.startAt ? toISTDateString(row.startAt) : null;
      if (truck) truckHours.set(truck, (truckHours.get(truck) || 0) + duration);
      if (day) dayHours.set(day, (dayHours.get(day) || 0) + duration);
    }
  }
  const trucks = [...truckHours.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const days = [...dayHours.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, hours]) => ({ day, hours: Number(hours.toFixed(2)) }));
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
                    {formatNumber(stops.length)} idle stops
                  </button>{' '}
                  in the selected period
                  {runningKnown && open.length
                    ? `, ${formatNumber(open.length)} of them still going`
                    : ''}
                  .
                </>
              ) : (
                'Idle history is unavailable.'
              )}
            </>
          )}
        </p>
        <small>
          Idle stops follow the selected dates and include stops still going.
          {runningKnown ? '' : ' Stops still going could not be loaded, so they are left out.'}{' '}
          Excess-idling cost is an estimate from finished stops.
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
            'Idle stops',
            historyReady ? formatNumber(stops.length) : '—',
            truncated ? 'Loaded records · incomplete' : 'Selected period',
            onHistory,
          ],
          [
            'Idle hours',
            hours == null ? '—' : `${formatNumber(hours, { digits: 1 })} h`,
            'Selected period',
            onHistory,
          ],
          [
            'Excess idling',
            cost == null ? '—' : formatInr(cost),
            'Estimated cost · finished stops',
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
      {trucks.length ? (
        <figure className="intel-idle-chart" aria-label="Recorded idle hours by truck">
          <figcaption>Recorded idle hours · top {trucks.length} trucks</figcaption>
          {trucks.map(([truck, value]) => (
            <div className="intel-idle-bar" key={truck}>
              <span>{truck}</span>
              <i aria-hidden="true">
                <b style={{ width: `${(100 * value) / (trucks[0][1] || 1)}%` }} />
              </i>
              <span>{formatNumber(value, { digits: 1 })} h</span>
            </div>
          ))}
        </figure>
      ) : null}
      {days.length ? (
        <figure className="intel-idle-chart" aria-label="Recorded idle hours by day">
          <figcaption>Recorded idle hours by day</figcaption>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={days}>
              <XAxis dataKey="day" tickFormatter={(day) => day.slice(5)} />
              <YAxis unit=" h" />
              <Tooltip />
              <Line dataKey="hours" stroke="#315be1" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </figure>
      ) : null}
    </section>
  );
}
