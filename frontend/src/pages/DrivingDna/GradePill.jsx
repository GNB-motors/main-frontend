import React from 'react';
import { formatNum, isKnownNumber } from '../../utils/formatters';

const GRADE_COLOR = {
  A: 'var(--ok)',
  B: '#65a30d',
  C: '#d97706',
  D: 'var(--critical)',
};

/**
 * GradePill — the Driving DNA grade + score, shared by the Driving DNA page
 * and the Performance section's Driver DNA card (so the two never drift apart).
 *
 * A grade without its evidence is not a verdict, so the pill also carries the
 * coverage it was calculated on and an optional "How calculated" action. When
 * there is not enough evidence there is no grade: the pill shows "—" and the
 * reason, never a silent zero.
 */
export function GradePill({ grade, score, coverage = null, reason = null, onExplain = null }) {
  const hasGrade = typeof grade === 'string' && grade.trim() !== '';
  const hasScore = isKnownNumber(score);

  if (!hasGrade && !hasScore) {
    return (
      <span className="inline-flex items-center gap-2">
        <span
          className="ov-pill"
          style={{
            color: 'var(--cluster-text-dim)',
            border: '1px solid var(--cluster-text-dim)',
            background: 'transparent',
          }}
          title={reason || 'Not enough data'}
        >
          —
        </span>
        {reason ? (
          <span className="text-[11px]" style={{ color: 'var(--ds-ink3)' }}>
            {reason}
          </span>
        ) : null}
      </span>
    );
  }

  const color = GRADE_COLOR[grade] || 'var(--cluster-text-dim)';

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="ov-pill"
        style={{ color, border: `1px solid ${color}`, background: 'transparent' }}
      >
        {grade || '—'}
      </span>
      <span className="num font-semibold" style={{ color }}>
        {hasScore ? formatNum(score) : '—'}
      </span>
      {coverage ? (
        <span className="text-[11px]" style={{ color: 'var(--ds-ink3)' }}>
          {coverage}
        </span>
      ) : null}
      {onExplain ? (
        <button
          type="button"
          className="border-0 bg-transparent p-0 text-[11px] underline"
          style={{ color: 'var(--ds-ink2)' }}
          onClick={onExplain}
        >
          How calculated
        </button>
      ) : null}
    </span>
  );
}

export default GradePill;
