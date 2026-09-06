import React from 'react';
import { TrendingUp, TrendingDown, Trophy, AlertTriangle } from 'lucide-react';
import { splitLeaderboard, formatMetric } from '../../lib/leaderboard';

/**
 * Leaderboard — shows BOTH ends of a metric: the best rows and the worst.
 * A leaderboard that only celebrates the best is how overspending stays
 * invisible.
 *
 *   <Leaderboard
 *     title="Route profitability"
 *     unit="currency"            // 'currency' | 'number' | 'percent'
 *     metricKey="margin"
 *     rows={[{ route: 'JSR–RNC', margin: 4200 }, ...]}
 *     rowLabel={(r) => r.route}
 *     rowSub={(r) => `${r.trips} trips`}
 *   />
 *
 * Empty/absent data renders as an explicit state, never as a fake zero
 * leaderboard.
 */
export default function Leaderboard({
  title,
  unit = 'number',
  metricKey,
  rows = [],
  rowLabel = (r) => r.label || '—',
  rowSub = () => '',
  size = 5,
}) {
  const { best, worst } = splitLeaderboard(rows, metricKey, { size });

  if (best.length === 0) {
    return (
      <section className="lb" aria-label={title}>
        <header className="lb-head">
          <h3 className="lb-title">{title}</h3>
        </header>
        <div className="lb-empty">No ranked data yet — rows without a {metricKey} reading are not ranked.</div>
      </section>
    );
  }

  const renderRow = (row, rank, Icon, tone) => (
    <li key={`${rowLabel(row)}-${rank}`} className={`lb-row lb-row--${tone}`}>
      <span className="lb-rank">{rank + 1}</span>
      <Icon size={14} className="lb-tone-icon" aria-hidden="true" />
      <span className="lb-label">
        <strong>{rowLabel(row)}</strong>
        {rowSub(row) && <small>{rowSub(row)}</small>}
      </span>
      <span className="lb-value">{formatMetric(row[metricKey], unit)}</span>
    </li>
  );

  return (
    <section className="lb" aria-label={title}>
      <header className="lb-head">
        <h3 className="lb-title">{title}</h3>
      </header>
      <div className="lb-cols">
        <div className="lb-col">
          <h4 className="lb-col-title lb-col-title--best"><Trophy size={13} aria-hidden="true" /> Best</h4>
          <ol className="lb-list">{best.map((r, i) => renderRow(r, i, TrendingUp, 'best'))}</ol>
        </div>
        <div className="lb-col">
          <h4 className="lb-col-title lb-col-title--worst"><AlertTriangle size={13} aria-hidden="true" /> Needs attention</h4>
          <ol className="lb-list">{worst.map((r, i) => renderRow(r, i, TrendingDown, 'worst'))}</ol>
        </div>
      </div>
    </section>
  );
}
