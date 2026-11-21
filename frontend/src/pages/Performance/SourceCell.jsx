import React from 'react';
import {
  SOURCE_LABEL,
  cellSource,
  cellUncertainty,
  cellUnit,
  formatCellNumber,
  formatCellValue,
  isUnknownCell,
  plainReason,
} from './performanceCells';

const UNITLESS = ['score', 'count', 'factor', 'INR'];

/** "10.1%" but "5.26 km/L": a percent sign sits on the number; a score has none. */
const unitSuffix = (unit) => {
  if (!unit || UNITLESS.includes(unit)) return '';
  return unit === '%' ? '%' : ` ${unit}`;
};

/**
 * SourceCell — one contract cell, rendered with where it came from.
 *
 *   measured          the number alone: a reading from the truck is the default
 *   vendor            the number + an "iALERT" tag (never merged with ours)
 *   estimated         the number ± its uncertainty + a dashed "Estimated" tag
 *   not_comparable    a dash, with the reason in words
 *   insufficient_data a dash, with the reason in words
 *
 * A missing number is NEVER rendered as 0. `reason="hidden"` keeps the reason
 * for screen readers only, for a table whose gaps are explained once above it.
 */
export default function SourceCell({ cell, decimals = 1, reason = 'inline', className = '' }) {
  const source = cellSource(cell);
  const unknown = isUnknownCell(cell);
  const uncertainty = cellUncertainty(cell);
  const unit = cellUnit(cell);
  const why = unknown ? plainReason(cell) : null;
  const tagged = !unknown && (source === 'vendor' || source === 'estimated');

  return (
    <span className={['psrc', className].filter(Boolean).join(' ')} data-source={source}>
      <span className="psrc-value">
        {!unknown && unit === 'INR' ? '₹' : null}
        {unknown ? '—' : formatCellValue(cell, decimals)}
        {unit && !unknown ? <span className="psrc-unit">{unitSuffix(unit)}</span> : null}
        {uncertainty != null ? (
          <span className="psrc-uncertainty"> ±{formatCellNumber(uncertainty, decimals)}</span>
        ) : null}
      </span>
      {tagged ? (
        <span className={`psrc-tag psrc-tag--${source}`}>{SOURCE_LABEL[source]}</span>
      ) : null}
      {why ? <span className={reason === 'hidden' ? 'sr-only' : 'psrc-reason'}>{why}</span> : null}
      {source === 'estimated' && !unknown && uncertainty == null ? (
        <span className="psrc-reason">Uncertainty not reported.</span>
      ) : null}
    </span>
  );
}
