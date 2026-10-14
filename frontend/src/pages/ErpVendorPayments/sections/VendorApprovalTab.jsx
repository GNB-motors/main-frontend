import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../../components/Erp/StatusBadge';
import { money } from '../money';

function VendorApprovalTab({ awaitingApproval, awaitingApprovalTotal }) {
  return (
    <section className="erp-card">
      <h3>Submitted — awaiting approval</h3>
      {awaitingApproval.length === 0 ? (
        <p className="erp-muted">
          Nothing is waiting on approval. Payments appear here between &ldquo;Submit for
          approval&rdquo; and an approver&rsquo;s decision.
        </p>
      ) : (
        <>
          <div className="erp-table-wrap">
            <table className="erp-table compact">
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Raised</th>
                  <th>Bills</th>
                  <th>Net payable</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {awaitingApproval.map((p) => (
                  <tr key={p._id}>
                    <td className="erp-cell-strong">{p.paymentNumber}</td>
                    <td className="erp-cell-muted">{p.paymentDate?.slice?.(0, 10) || '—'}</td>
                    <td>{p.billAllocations?.length ?? 0}</td>
                    <td>{money(p.netPayable)}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="erp-alloc-foot">
            <div className="erp-alloc-cell">
              <span>Awaiting approval</span>
              <strong>{money(awaitingApprovalTotal)}</strong>
            </div>
            <div className="erp-alloc-cell">
              <span>Decisions are made in</span>
              <strong>
                <Link to="/erp/approvals">Approvals</Link>
              </strong>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default VendorApprovalTab;
