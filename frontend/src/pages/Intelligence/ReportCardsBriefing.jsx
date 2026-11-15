import { formatNumber } from '@/utils/redesign/format';

import { cardsBriefing } from './reportCardsBriefingModel';

export default function ReportCardsBriefing({ cards, subject, onGrade }) {
  const summary = cardsBriefing(cards);
  const noun = subject === 'driver' ? 'drivers' : 'trucks';
  return (
    <section
      className="intel-assessment-briefing"
      aria-label={`${subject === 'driver' ? 'Driver' : 'Truck'} briefing`}
    >
      <div className="intel-assessment-brief-copy">
        <span>✧ Period read</span>
        <p>
          {summary.averageScore != null ? (
            <>
              The graded {noun} average{' '}
              <b>{formatNumber(summary.averageScore, { maximumFractionDigits: 1 })}</b>.{' '}
            </>
          ) : (
            <>There are no measured scores for these {noun} yet. </>
          )}
          {summary.falling ? (
            <>
              <button onClick={() => onGrade('FALLING')}>
                {summary.falling} {noun} are falling off
              </button>
              .{' '}
            </>
          ) : null}
          {summary.ungraded ? (
            <>
              <button onClick={() => onGrade('NOT_ENOUGH_DATA')}>
                {summary.ungraded} {noun} need more data
              </button>{' '}
              before they can be assessed.
            </>
          ) : (
            'Open a record to see the evidence behind its assessment.'
          )}
        </p>
        <small>
          {summary.graded} graded out of {summary.total} {noun}. Missing scores are excluded from
          the average. Trends describe recorded assessments; no next-week forecast is available.
        </small>
      </div>
      <div className="intel-assessment-brief-kpis">
        {[
          [
            'Average score',
            summary.averageScore == null
              ? '—'
              : formatNumber(summary.averageScore, { maximumFractionDigits: 1 }),
            'Graded records only',
            'all',
          ],
          ['Excellent', summary.grades.EXCELLENT || 0, 'Current assessment', 'EXCELLENT'],
          ['Falling off', summary.falling, 'Current assessment', 'FALLING'],
          ['Insufficient data', summary.ungraded, 'Not a performance judgement', 'NOT_ENOUGH_DATA'],
        ].map(([label, value, note, grade]) => (
          <button key={label} onClick={() => onGrade(grade)}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

export function ScoreSparkline({ history = [], trend }) {
  const points = history.filter((point) => Number.isFinite(point.score) && point.day).slice(-7);
  if (points.length < 2)
    return (
      <span className="intel-assessment-trend-missing">
        {trend === 'UP'
          ? 'Improving ↑'
          : trend === 'DOWN'
            ? 'Declining ↓'
            : trend === 'FLAT'
              ? 'Steady'
              : '—'}
      </span>
    );
  const times = points.map((point) => Date.parse(point.day));
  const first = Math.min(...times),
    span = Math.max(1, Math.max(...times) - first);
  const path = points
    .map(
      (point, index) =>
        `${((times[index] - first) / span) * 58 + 1},${19 - (Math.max(0, Math.min(100, point.score)) / 100) * 18}`,
    )
    .join(' ');
  return (
    <svg
      width="60"
      height="20"
      viewBox="0 0 60 20"
      role="img"
      aria-label={`Recorded score history: ${points.map((point) => `${point.day}: ${point.score}`).join(', ')}`}
    >
      <polyline
        points={path}
        fill="none"
        stroke={points.at(-1).score < points[0].score ? '#dd3030' : '#187a32'}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
