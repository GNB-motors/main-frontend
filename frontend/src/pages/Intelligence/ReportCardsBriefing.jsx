import { formatNumber } from '@/utils/redesign/format';

import { cardsBriefing } from './reportCardsBriefingModel';

export default function ReportCardsBriefing({ cards, subject, onGrade }) {
  const summary = cardsBriefing(cards);
  const noun = subject === 'driver' ? 'drivers' : 'trucks';
  const gradeBreakdown = [
    ['EXCELLENT', 'Excellent', '#15803d'],
    ['GOOD', 'Good', '#2563eb'],
    ['FAIR', 'Fair', '#b45309'],
    ['FALLING', 'Falling off', '#b91c1c'],
    ['NOT_ENOUGH_DATA', 'Insufficient data', '#64748b'],
  ].filter(([grade]) => summary.grades[grade]);
  let start = 0;
  const gradient = gradeBreakdown
    .map(([grade, , color]) => {
      const end = start + (summary.grades[grade] / summary.total) * 100;
      const stop = `${color} ${start}% ${end}%`;
      start = end;
      return stop;
    })
    .join(', ');
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
      {subject === 'vehicle' && gradeBreakdown.length ? (
        <div className="intel-grade-distribution" aria-label="Truck grades">
          <div
            className="intel-grade-donut"
            aria-hidden="true"
            style={{ background: `conic-gradient(${gradient})` }}
          />
          <ul>
            {gradeBreakdown.map(([grade, label, color]) => (
              <li key={grade}>
                <button type="button" onClick={() => onGrade(grade)}>
                  <span aria-hidden="true" style={{ color }}>
                    ●
                  </span>{' '}
                  {label} · {summary.grades[grade]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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

export function ScoreChange({ history = [], score }) {
  const previous = history.filter((point) => Number.isFinite(point.score) && point.day).at(0);
  if (!previous || !Number.isFinite(score)) return '—';
  const change = score - previous.score;
  if (change === 0) return 'No change';
  return `${formatNumber(Math.abs(change))} points ${change > 0 ? 'up' : 'down'}`;
}
