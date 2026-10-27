import React from 'react';
import { formatNum } from '../../utils/formatters';

const GRADE_COLOR = {
  A: 'var(--ok)',
  B: '#65a30d',
  C: '#d97706',
  D: 'var(--critical)',
};

/**
 * GradePill — the Driving DNA grade + score, shared by the Driving DNA page
 * and the Performance section's Driver DNA card (so the two never drift apart).
 */
export function GradePill({ grade, score }) {
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
        {score != null ? formatNum(score) : '—'}
      </span>
    </span>
  );
}

export default GradePill;
