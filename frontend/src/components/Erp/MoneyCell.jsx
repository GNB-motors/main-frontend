import React from 'react';
import { Link } from 'react-router-dom';
import { money, compactInr, drCr } from '../../utils/formatMoney';

/**
 * MoneyCell — every money figure inside a table.
 *
 * Always tabular-nums and right-aligned so columns of figures line up at the
 * decimal, which is the only way a column of amounts is scannable.
 *
 * Pass `to` to make the figure a drill-down. When `to` is null the cell renders
 * as plain text — that is deliberate, so callers can pass documentPathFor(...)
 * directly and get a working link for the document types that have a page and
 * inert text for the ones that don't, without shipping dead links.
 */
const MoneyCell = ({
  value,
  to = null,
  compact = false,
  accounting = false,
  tone = null,
  bold = false,
  suffix = null,
}) => {
  let text;
  let toneClass = tone;

  if (accounting) {
    const b = drCr(value);
    text = b.text;
    if (!toneClass && b.tone === 'credit') toneClass = 'credit';
  } else {
    text = value === null || value === undefined || value === '' ? '—' : (compact ? compactInr(value) : money(value));
  }

  const style = {
    fontWeight: bold ? 600 : undefined,
    color: toneClass === 'danger' ? '#b91c1c'
      : toneClass === 'warning' ? '#b45309'
        : toneClass === 'success' ? '#15803d'
          : toneClass === 'muted' ? '#64748b'
            : undefined,
  };

  const content = (
    <span style={style}>
      {text}
      {suffix && <span style={{ color: '#94a3b8', marginLeft: '4px' }}>{suffix}</span>}
    </span>
  );

  return (
    <span className="erp-numeric" style={{ display: 'block', textAlign: 'right' }}>
      {to ? (
        <Link to={to} className="erp-money-link">
          {content}
        </Link>
      ) : content}
    </span>
  );
};

export default MoneyCell;
