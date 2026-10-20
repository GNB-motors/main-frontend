import React from 'react';
import { Printer } from 'lucide-react';
import StatusBadge from '../../../components/Erp/StatusBadge';
import { money } from '../money';

function SaleBillsTable({ bills, openDetail, handlePrint, busy }) {
  return (
    <div className="erp-table-wrap">
      <table className="erp-table">
        <thead>
          <tr>
            <th>Bill #</th>
            <th>Party</th>
            <th>Date</th>
            <th>Lines</th>
            <th>Net</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {bills.length === 0 ? (
            <tr>
              <td colSpan={7} className="erp-muted">
                No sale bills yet.
              </td>
            </tr>
          ) : (
            bills.map((b) => (
              <tr key={b._id}>
                <td>{b.billNumber}</td>
                <td>{b.partyId?.name || '—'}</td>
                <td>{b.billDate ? new Date(b.billDate).toLocaleDateString('en-IN') : '—'}</td>
                <td>{b.lines?.length ?? '—'}</td>
                <td>{money(b.netAmount)}</td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
                <td>
                  <button type="button" className="erp-btn" onClick={() => openDetail(b._id)}>
                    View
                  </button>
                  {['APPROVED', 'SUBMITTED', 'PARTIALLY_PAID', 'PAID'].includes(b.status) && (
                    <button
                      type="button"
                      className="erp-btn erp-btn-primary"
                      style={{ marginLeft: 8 }}
                      onClick={() => handlePrint(b._id)}
                      disabled={busy}
                    >
                      <Printer size={14} /> Print
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SaleBillsTable;
