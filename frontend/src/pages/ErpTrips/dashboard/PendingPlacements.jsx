import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';

const PendingPlacements = ({ pendingPlacements }) => (
  <section className="trippipe-pending">
    <header className="trippipe-pending-head">
      <Clock size={15} />
      <div>
        <strong>
          {pendingPlacements.length} placement
          {pendingPlacements.length === 1 ? '' : 's'} awaiting approval
        </strong>
        <span className="erp-cell-muted">
          These have no trip yet — one is created the moment approval clears.
        </span>
      </div>
      <Link to="/erp/approvals" className="trippipe-pending-link">
        Review approvals
        <ArrowRight size={14} />
      </Link>
    </header>

    <div className="erp-table-scroll">
      <table className="erp-table compact">
        <thead>
          <tr>
            <th>Placement</th>
            <th>Delivery order</th>
            <th>Vehicle / vendor</th>
            <th>Planned</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pendingPlacements.map((p) => (
            <tr key={p._id}>
              <td className="erp-cell-strong">{p.placementNumber}</td>
              <td>
                <div>{p.doId?.doNumber || '—'}</div>
                <div className="erp-cell-muted">{p.doId?.material || ''}</div>
              </td>
              <td className="erp-cell-muted">
                {p.vehicleId?.registrationNumber || p.vendorId?.name || '—'}
              </td>
              <td>
                {p.plannedQty ?? '—'} {p.qtyUnit || ''}
              </td>
              <td>
                <span className="erp-badge warning">
                  <Clock size={11} />
                  Awaiting approval
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default PendingPlacements;
