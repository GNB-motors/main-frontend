import React from 'react';
import {
  SOURCE_LABEL,
  cellNumber,
  cellSource,
  cellUncertainty,
  isUnknownCell,
  plainReason,
} from './performanceCells';
import { formatPace } from './paceModel';

export default function PaceCell({ cell, reason = 'inline' }) {
  const source = cellSource(cell);
  const unknown = isUnknownCell(cell);
  const value = cellNumber(cell);
  const uncertainty = cellUncertainty(cell);
  const tagged = !unknown && (source === 'vendor' || source === 'estimated');

  return (
    <span className="psrc" data-source={source}>
      <span className="psrc-value">{unknown ? '—' : formatPace(value, uncertainty)}</span>
      {tagged ? (
        <span className={`psrc-tag psrc-tag--${source}`}>{SOURCE_LABEL[source]}</span>
      ) : null}
      {unknown ? (
        <span className={reason === 'hidden' ? 'sr-only' : 'psrc-reason'}>{plainReason(cell)}</span>
      ) : null}
      {source === 'estimated' && !unknown && uncertainty == null ? (
        <span className="psrc-reason">Uncertainty not reported.</span>
      ) : null}
    </span>
  );
}
