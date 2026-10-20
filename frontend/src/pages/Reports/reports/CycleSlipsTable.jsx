import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { formatCurrency, formatNumber } from './tripReportsUtils';
import { SLIP_ROLE_LABEL, slipsHref, slipsTotals } from './cycleTrips';

const litres = (v) => (typeof v === 'number' ? `${v.toFixed(2)} L` : '—');

/** The fuel slips that make one cycle: opening full tank, top-ups, closing full tank. */
export default function CycleSlipsTable({ slips, cycle }) {
  const totals = slipsTotals(slips);
  const href = slipsHref(cycle);
  return (
    <div className="rpt-cycle-slips">
      <div className="rpt-cycle-trips-summary">
        <strong className="rpt-cycle-slips-title">Fuel slips</strong>
        <span title="Top-ups plus the closing full tank — the opening fill belongs to the cycle before">
          {slips.length} slip{slips.length === 1 ? '' : 's'} · Diesel used{' '}
          <strong>{litres(totals.litres)}</strong> ·{' '}
          <strong>{formatCurrency(totals.amount)}</strong>
        </span>
        {href ? (
          <Link to={href} className="rpt-cycle-slips-link" onClick={(e) => e.stopPropagation()}>
            View slips <ExternalLink size={12} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      {slips.length === 0 ? (
        <div className="rpt-cycle-trips--note">
          No fuel slips for this cycle (it comes from the uploaded oil register).
        </div>
      ) : (
        <table className="rpt-cycle-trips-table">
          <thead>
            <tr>
              <th>Slip</th>
              <th>Refuel time</th>
              <th>Pump</th>
              <th className="num">Odometer</th>
              <th className="num">Litres</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {slips.map((s) => (
              <tr key={s.id}>
                <td>
                  <span
                    className={`rpt-slip-tag rpt-slip-tag--${s.role === 'PARTIAL' ? 'partial' : 'full'}`}
                  >
                    {SLIP_ROLE_LABEL[s.role] || s.role}
                  </span>
                </td>
                <td>{s.refuelTime ? formatDateTimeIST(s.refuelTime) : '—'}</td>
                <td>{s.station || '—'}</td>
                <td className="num">
                  {s.odometer != null ? `${formatNumber(s.odometer)} km` : '—'}
                </td>
                <td className="num">{litres(s.litres)}</td>
                <td className="num">
                  {formatCurrency(s.amount)}
                  {s.rate != null ? <div className="rpt-cycle-trips-sub">₹{s.rate}/L</div> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
