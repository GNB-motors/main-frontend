import { Check, Fuel as FuelIcon } from 'lucide-react';
import { formatINR, formatLitres, formatNum } from '../../../utils/formatters';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { onRowKeyDown } from './onRowKeyDown';

export default function NdRefuelCard({ data, onOpenVehicle }) {
  const fills = data?.fills || [];
  return (
    <div className="nd-card">
      <div className="nd-card-head">
        <h2>Refuelling today</h2>
        <span className="nd-count-pill">{data?.totalCount || 0}</span>
        <span className="nd-sp" />
        {data?.litresFilled ? (
          <span className="nd-hint">
            ₹
            {data.spendInr && data.litresFilled
              ? Math.round(data.spendInr / data.litresFilled)
              : '—'}
            /L avg
          </span>
        ) : null}
      </div>
      {fills.length === 0 ? (
        <div className="nd-empty">
          <span className="nd-ok">
            <FuelIcon size={22} />
          </span>
          <b>No fills recorded today</b>
          <span>Refuel logs appear here as drivers capture them.</span>
        </div>
      ) : (
        <>
          <div className="nd-ministats">
            <div className="nd-ministat">
              <div className="nd-k">Litres filled</div>
              <div className="nd-v">{formatLitres(data.litresFilled)}</div>
            </div>
            <div className="nd-ministat">
              <div className="nd-k">Spend</div>
              <div className="nd-v">{formatINR(data.spendInr)}</div>
            </div>
            <div className="nd-ministat">
              <div className="nd-k">Tank-verified</div>
              <div className="nd-v">
                {data.verifiedCount}/{data.totalCount}
              </div>
            </div>
          </div>
          <table className="nd-tbl">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Litres</th>
                <th className="nd-num">Amount</th>
                <th>Check</th>
              </tr>
            </thead>
            <tbody>
              {fills.map((f, i) => (
                <tr
                  key={`${f.vehicleId}-${i}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenVehicle(f.vehicleId)}
                  onKeyDown={onRowKeyDown(() => onOpenVehicle(f.vehicleId))}
                >
                  <td>
                    <span className="nd-plate">{f.registrationNumber}</span>
                    <div className="nd-muted" style={{ fontSize: 11 }}>
                      {[f.station, f.refuelTime ? formatDateTimeIST(f.refuelTime) : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </td>
                  <td className="nd-muted">{formatLitres(f.litres)}</td>
                  <td className="nd-num">{formatINR(f.amountInr)}</td>
                  <td>
                    <span
                      className="nd-state"
                      style={{ color: f.tankVerified === false ? '#C2323A' : '#187A32' }}
                    >
                      <i />
                      {f.tankVerified === false
                        ? f.billVarianceL != null
                          ? `${formatNum(f.billVarianceL)} L`
                          : 'Mismatch'
                        : f.tankVerified === true
                          ? 'Verified'
                          : 'Unmatched'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {data?.lowTankBeforeTrip?.length ? (
        <div className="nd-band">
          <span className="nd-ic">
            <FuelIcon size={16} />
          </span>
          <span>
            <b>{data.lowTankBeforeTrip.length}</b> vehicle
            {data.lowTankBeforeTrip.length === 1 ? '' : 's'} start a trip within 24h under{' '}
            {formatLitres(data.lowFuelThresholdL)}
          </span>
        </div>
      ) : fills.length > 0 ? (
        <div className="nd-band" style={{ background: 'rgba(37,186,76,.12)' }}>
          <span className="nd-ic" style={{ color: '#187A32' }}>
            <Check size={16} />
          </span>
          <span>Every vehicle with a trip in the next 24h has fuel for the leg.</span>
        </div>
      ) : null}
    </div>
  );
}
