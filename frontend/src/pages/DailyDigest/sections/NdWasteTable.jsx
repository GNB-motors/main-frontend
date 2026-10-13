import { Check } from 'lucide-react';
import { formatINR, formatKm, formatNum } from '../../../utils/formatters';
import { onActivateKey } from '../../../utils/onActivateKey';

export default function NdWasteTable({ idlingTop5, detourTop5, onOpenVehicle }) {
  const byVehicle = new Map();
  (idlingTop5 || []).forEach((r) =>
    byVehicle.set(r.registrationNumber, { ...r, detourKm: 0, detourCostInr: 0 }),
  );
  (detourTop5 || []).forEach((r) => {
    const row = byVehicle.get(r.registrationNumber) || {
      registrationNumber: r.registrationNumber,
      idleMinutes: 0,
      idleCostInr: 0,
    };
    row.detourKm = r.detourKm;
    row.detourCostInr = r.detourCostInr;
    byVehicle.set(r.registrationNumber, row);
  });
  const rows = [...byVehicle.values()].sort(
    (a, b) => b.idleCostInr + b.detourCostInr - (a.idleCostInr + a.detourCostInr),
  );

  return (
    <div className="nd-card">
      <div className="nd-card-head">
        <h2>Idling &amp; detour waste</h2>
        <span className="nd-sp" />
        <span className="nd-hint">Today · top 5 vehicles</span>
      </div>
      {rows.length === 0 ? (
        <div className="nd-empty">
          <span className="nd-ok">
            <Check size={22} />
          </span>
          <b>No idling or detour waste today</b>
          <span>Vehicles idling over 30 min or driving off-route appear here.</span>
        </div>
      ) : (
        <table className="nd-tbl">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Idling</th>
              <th>Detour</th>
              <th className="nd-num">Cost today</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.registrationNumber}
                role="button"
                tabIndex={0}
                onClick={() => onOpenVehicle(r.registrationNumber)}
                onKeyDown={onActivateKey(() => onOpenVehicle(r.registrationNumber))}
              >
                <td>
                  <span className="nd-plate">{r.registrationNumber}</span>
                </td>
                <td className="nd-muted">
                  {r.idleMinutes ? `${formatNum(r.idleMinutes)} min` : '—'}
                </td>
                <td className="nd-muted">{r.detourKm ? formatKm(r.detourKm) : '—'}</td>
                <td className="nd-num" style={{ color: '#C2323A' }}>
                  {formatINR(r.idleCostInr + r.detourCostInr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
