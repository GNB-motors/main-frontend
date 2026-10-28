import { formatPct } from '../../utils/formatters';
import { TONE } from './defLedgerStatus';

function DosingBadge({ vehicle }) {
  if (vehicle.status === 'NOT_APPLICABLE')
    return <span className="text-slate-400 text-[11px]">Not applicable</span>;
  if (vehicle.dosingRatioPct == null) {
    return <span className="text-slate-400 text-[11px]">—</span>;
  }
  const { min, max } = vehicle.defBand || {};
  const assessed = Number.isFinite(min) && Number.isFinite(max);
  const inBand = vehicle.dosingRatioPct >= min && vehicle.dosingRatioPct <= max;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${!assessed ? TONE.muted : inBand ? TONE.ok : TONE.warn}`}
      title={
        assessed
          ? `Normal band ${min}–${max}% of diesel`
          : 'Dosing shown without a calibrated assessment band'
      }
    >
      {formatPct(vehicle.dosingRatioPct, { decimals: 1 })}
    </span>
  );
}

export default DosingBadge;
