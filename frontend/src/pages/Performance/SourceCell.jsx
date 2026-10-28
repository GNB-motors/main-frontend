import React from 'react';
import {
  SOURCE_LABEL,
  cellReason,
  cellSource,
  cellUncertainty,
  cellUnit,
  formatCellNumber,
  formatCellValue,
  isUnknownCell,
} from './performanceCells';

/**
 * SourceCell — one contract cell, rendered with where it came from.
 *
 *   measured          the number + a "measured" badge
 *   vendor            the number + a "vendor" badge (never merged with ours)
 *   estimated         the number + "estimated" + the uncertainty it carries
 *   not_comparable    no number, struck through, with the reason
 *   insufficient_data no number, with the reason
 *
 * A missing number is NEVER rendered as 0: it is rendered as an em dash with
 * the reason beside it.
 */
export default function SourceCell({ cell, decimals = 1, className = '' }) {
  const source = cellSource(cell);
  const unknown = isUnknownCell(cell);
  const uncertainty = cellUncertainty(cell);
  const unit = cellUnit(cell);
  const reason = unknown ? cellReason(cell) : null;

  return (
    <span className={['psrc', className].filter(Boolean).join(' ')} data-source={source}>
      <span className="psrc-value">
        {unknown ? '—' : formatCellValue(cell, decimals)}
        {uncertainty != null ? (
          <span className="psrc-uncertainty">±{formatCellNumber(uncertainty, decimals)}</span>
        ) : null}
        {unit && !unknown ? <span className="psrc-unit"> {unit}</span> : null}
      </span>
      <span className={`psrc-badge psrc-badge--${source}`}>{SOURCE_LABEL[source]}</span>
      {reason ? <span className="psrc-reason">{reason}</span> : null}
      {source === 'estimated' && uncertainty == null ? (
        <span className="psrc-reason">Uncertainty not reported.</span>
      ) : null}
    </span>
  );
}
