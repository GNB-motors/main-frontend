import { formatPct } from '../../utils/formatters';
import { TONE } from './defLedgerStatus';

function DosingBadge({ vehicle }) {
  if (vehicle.dosingRatioPct == null) {
    return <span className="text-slate-400 text-[11px]">—</span>;
  }
  const { min, max } = vehicle.defBand || {};
  const inBand = vehicle.dosingRatioPct >= min && vehicle.dosingRatioPct <= max;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${inBand ? TONE.ok : TONE.warn}`}
      title={`Normal band ${min}–${max}% of diesel`}
    >
      {formatPct(vehicle.dosingRatioPct, { decimals: 1 })}
    </span>
  );
}

export default DosingBadge;
