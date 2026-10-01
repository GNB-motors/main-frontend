import { cycleNote, excludedCycleHint } from './fleetReportUtils';
import { formatNum } from '../../../utils/formatters';

/** Primary label with a muted second line; deleted records are marked. */
export function NameCell({ primary, secondary, isDeleted }) {
  return (
    <>
      <div
        className="cell-primary"
        style={isDeleted ? { color: '#9ca3af', fontStyle: 'italic' } : undefined}
      >
        {primary || '—'}
      </div>
      {secondary ? <div className="cell-secondary">{secondary}</div> : null}
    </>
  );
}

/** km/L with the cycles it rests on, and why any were left out. */
export function KmplCell({ value, cycleCount, excludedCycleCount, plausible }) {
  return (
    <div title={excludedCycleCount ? excludedCycleHint(plausible) : undefined}>
      <div className="cell-primary" style={value != null ? { fontWeight: 600 } : undefined}>
        {value != null ? `${formatNum(value, { decimals: 2 })} km/L` : '—'}
      </div>
      <div className="cell-secondary">{cycleNote(cycleCount, excludedCycleCount)}</div>
    </div>
  );
}
