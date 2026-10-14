import React from 'react';
import { Send } from 'lucide-react';
import StatusBadge from '../../../components/Erp/StatusBadge';
import { money } from '../money';

function VendorOutstandingTab({
  loading,
  groups,
  openVendor,
  selectedVendor,
  billsInFlight,
  selectedBillIds,
  toggleBill,
  selectedTotal,
  busy,
  prepareSubmit,
}) {
  return (
    <div className="erp-split">
      <section className="erp-card">
        <h3>Vendors</h3>
        {loading && <p>Loading…</p>}
        {!loading && groups.length === 0 && (
          <p className="erp-muted">No outstanding vendor bills.</p>
        )}
        {!loading && groups.length > 0 && (
          <ul className="erp-list">
            {groups.map((g) => (
              <li key={g.vendorId}>
                <button type="button" className="erp-link-btn" onClick={() => openVendor(g)}>
                  {g.vendorName} — {money(g.totalOutstanding)} ({g.billCount} bills)
                  {g.onAccountAvailable > 0 && ` · On-a/c ${money(g.onAccountAvailable)}`}
                  {g.podPendingCount > 0 && ` · POD pending ${g.podPendingCount}`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedVendor && (
        <section className="erp-card">
          <h3>{selectedVendor.vendorName} — select bills</h3>
          <div className="erp-table-wrap">
            <table className="erp-table compact">
              <thead>
                <tr>
                  <th aria-label="Select" />
                  <th>Bill</th>
                  <th>Trip</th>
                  <th>Route</th>
                  <th>Net</th>
                  <th>Due</th>
                  <th>Ageing</th>
                </tr>
              </thead>
              <tbody>
                {selectedVendor.bills.map((b) => {
                  const heldBy = billsInFlight.get(String(b.purchaseBillId));
                  return (
                    <tr key={b.purchaseBillId} className={heldBy ? 'erp-row-muted' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${b.billNumber}`}
                          checked={selectedBillIds.has(b.purchaseBillId)}
                          onChange={() => toggleBill(b.purchaseBillId)}
                          disabled={Boolean(heldBy)}
                          title={heldBy ? `Already in payment ${heldBy}` : undefined}
                        />
                      </td>
                      <td>
                        <div className="erp-cell-strong">{b.billNumber}</div>
                        <div className="erp-cell-muted">
                          {heldBy ? `In payment ${heldBy}` : b.vehicleNumber}
                        </div>
                      </td>
                      <td>{b.tripNumber}</td>
                      <td className="erp-cell-muted">{b.route || '—'}</td>
                      <td>{money(b.netAmount)}</td>
                      <td>{b.dueDate?.slice?.(0, 10) || '—'}</td>
                      <td>
                        {b.ageingBucket ? (
                          <StatusBadge status={b.ageingBucket} label={`${b.overdueDays ?? 0}d`} />
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedBillIds.size > 0 && (
            <div className="erp-alloc-foot">
              <div className="erp-alloc-cell">
                <span>Bills selected</span>
                <strong>{selectedBillIds.size}</strong>
              </div>
              <div className="erp-alloc-cell">
                <span>Payment amount</span>
                <strong>{money(selectedTotal)}</strong>
              </div>
              {selectedVendor.onAccountAvailable > 0 && (
                <div className="erp-alloc-cell">
                  <span>On-account available</span>
                  <strong>{money(selectedVendor.onAccountAvailable)}</strong>
                </div>
              )}
            </div>
          )}

          <div className="erp-form-actions">
            <button
              type="button"
              className="erp-btn primary"
              disabled={busy || selectedBillIds.size === 0}
              onClick={prepareSubmit}
            >
              <Send size={14} /> Submit for approval
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default VendorOutstandingTab;
