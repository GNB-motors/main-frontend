import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarClock } from 'lucide-react';
import { inr } from '../../../utils/formatMoney';

function NextSevenDaysPanel({ next7, loading }) {
  return (
    <div className="acc-card-panel acc-next7">
      <div className="acc-panel-head">
        <div className="acc-panel-title">
          <span className="acc-panel-ic acc-panel-ic--next">
            <CalendarClock size={15} />
          </span>
          <div>
            <h3>Next 7 days</h3>
            <p className="acc-panel-sub">Upcoming cash obligations</p>
          </div>
        </div>
      </div>

      <ul className="acc-next7-list">
        {next7.map((row) => (
          <li key={row.label}>
            <Link to={row.to} className="acc-next7-row">
              <span className="acc-next7-label">
                <span className={`acc-next7-tick acc-next7-tick--${row.tone}`} />
                {row.label}
              </span>
              <span className="acc-next7-amount">
                <strong className="erp-numeric">{loading ? '…' : inr(row.value)}</strong>
                <ArrowUpRight size={14} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NextSevenDaysPanel;
