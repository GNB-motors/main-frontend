import React from 'react';
import {
  SOURCE_LABEL,
  cellNumber,
  cellReason,
  cellSource,
  cellUncertainty,
  isUnknownCell,
} from './performanceCells';
import { formatPace } from './paceModel';

export default function PaceCell({ cell }) {
  const source = cellSource(cell);
  const unknown = isUnknownCell(cell);
  const value = cellNumber(cell);
  const uncertainty = cellUncertainty(cell);

  return (
    <span className="psrc" data-source={source}>
      <span className="psrc-value">{unknown ? '—' : formatPace(value, uncertainty)}</span>
      <span className={`psrc-badge psrc-badge--${source}`}>{SOURCE_LABEL[source]}</span>
      {unknown ? <span className="psrc-reason">{cellReason(cell)}</span> : null}
      {source === 'estimated' && !unknown && uncertainty == null ? (
        <span className="psrc-reason">Uncertainty not reported.</span>
      ) : null}
    </span>
  );
}
