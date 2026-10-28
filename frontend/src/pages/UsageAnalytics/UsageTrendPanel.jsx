import React from 'react';
import { calendarTrend, formatCount, formatDay, niceAxis, trendSummary } from './usageModel.js';

const PERIODS = [14, 30];
// Labels are counted back from the newest day so it is always labelled and the
// last two ticks can never collide.
const LABEL_EVERY = { 14: 2, 30: 5 };

export default function UsageTrendPanel({ daily, windowTo }) {
  const [period, setPeriod] = React.useState(14);
  const [activeIndex, setActiveIndex] = React.useState(null);
  const days = calendarTrend(daily, windowTo, period);
  const { total, average, peak } = trendSummary(days);
  const axis = niceAxis(peak?.views || 0);
  const active = activeIndex == null ? null : days[activeIndex];
  const pct = (views) => (views / axis.max) * 100;
  const showLabel = (index) => (days.length - 1 - index) % LABEL_EVERY[period] === 0;

  return (
    <section className="usage-panel" aria-labelledby="usage-trend-title">
      <header className="usage-panel-head">
        <div>
          <h2 id="usage-trend-title">Daily page opens</h2>
          <p>
            {days.length
              ? `${formatDay(days[0].day)} – ${formatDay(days[days.length - 1].day, { year: true })}`
              : `Last ${period} calendar days`}
          </p>
        </div>
        <div className="usage-segment" role="group" aria-label="Chart period">
          {PERIODS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={period === value}
              onClick={() => {
                setPeriod(value);
                setActiveIndex(null);
              }}
            >
              {value} days
            </button>
          ))}
        </div>
      </header>
      {days.length ? (
        <>
          <dl className="usage-trend-summary">
            <div>
              <dt>Total opens</dt>
              <dd>{formatCount(total)}</dd>
            </div>
            <div>
              <dt>Daily average</dt>
              <dd>{formatCount(average)}</dd>
            </div>
            <div>
              <dt>Busiest day</dt>
              <dd>
                {peak ? formatCount(peak.views) : '—'}
                {peak && <small>{formatDay(peak.day)}</small>}
              </dd>
            </div>
          </dl>
          <div
            className="usage-chart"
            role="img"
            aria-label={`Daily page opens for ${days[0].day} through ${days[days.length - 1].day}. Exact values are in the daily data table below.`}
          >
            <div className="usage-axis" aria-hidden="true">
              {axis.ticks.map((tick) => (
                <span key={tick} style={{ bottom: `${pct(tick)}%` }}>
                  {formatCount(tick)}
                </span>
              ))}
            </div>
            {/* Hover only previews a day the daily data table below states in full; it activates nothing. */}
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- see above */}
            <div
              className="usage-plot"
              onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const index = Math.floor(((event.clientX - rect.left) / rect.width) * days.length);
                setActiveIndex(Math.min(days.length - 1, Math.max(0, index)));
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {axis.ticks.map((tick) => (
                <span
                  key={tick}
                  className={`usage-gridline${tick === 0 ? ' usage-gridline--base' : ''}`}
                  style={{ bottom: `${pct(tick)}%` }}
                />
              ))}
              <div className="usage-bars">
                {days.map((day, index) => (
                  <div
                    key={day.day}
                    className={`usage-day${index === activeIndex ? ' is-active' : ''}`}
                  >
                    <span
                      className="usage-bar"
                      style={{ height: day.views ? `max(2px, ${pct(day.views)}%)` : 0 }}
                    />
                  </div>
                ))}
              </div>
              {active && (
                <div
                  className={`usage-tooltip${activeIndex < days.length / 2 ? ' is-start' : ' is-end'}`}
                  style={{
                    left: `${((activeIndex + 0.5) / days.length) * 100}%`,
                    bottom: `calc(${pct(active.views)}% + 10px)`,
                  }}
                >
                  <span>{formatDay(active.day, { weekday: true })}</span>
                  <strong>{formatCount(active.views)} opens</strong>
                  <small>{formatCount(active.followOn)} transitions</small>
                </div>
              )}
            </div>
            <div className="usage-ticks" aria-hidden="true">
              {days.map((day, index) => (
                <span key={day.day}>{showLabel(index) ? formatDay(day.day) : ''}</span>
              ))}
            </div>
          </div>
          <details className="usage-daily-data">
            <summary>View daily data</summary>
            <div className="usage-table-scroll">
              <table>
                <caption className="sr-only">Daily usage counts</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Page opens</th>
                    <th scope="col">Navigation transitions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...days].reverse().map((day) => (
                    <tr key={day.day}>
                      <th scope="row">{formatDay(day.day, { weekday: true, year: true })}</th>
                      <td>{formatCount(day.views)}</td>
                      <td>{formatCount(day.followOn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p className="usage-empty">Daily activity appears after your first completed rollup.</p>
      )}
    </section>
  );
}
