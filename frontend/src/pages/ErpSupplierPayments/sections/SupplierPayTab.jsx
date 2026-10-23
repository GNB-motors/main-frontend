import React from 'react';
import { Send } from 'lucide-react';
import { money } from '../money';

function SupplierPayTab({
  loading,
  groups,
  openSupplier,
  selectedSupplier,
  invoicesInFlight,
  selectedInvoiceIds,
  toggleInvoice,
  busy,
  preparePayment,
}) {
  return (
    <div className="erp-split">
      <section className="erp-card">
        <h3>Suppliers with outstanding</h3>
        {loading && <p>Loading…</p>}
        {!loading && groups.length === 0 && (
          <p className="erp-muted">No outstanding supplier invoices.</p>
        )}
        {!loading && groups.length > 0 && (
          <ul className="erp-list">
            {groups.map((g) => (
              <li key={g.supplierId}>
                <button type="button" className="erp-link-btn" onClick={() => openSupplier(g)}>
                  {g.supplierName} — {money(g.totalOutstanding)} ({g.invoiceCount} inv)
                  {g.onAccountAvailable > 0 && ` · On-a/c ${money(g.onAccountAvailable)}`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedSupplier && (
        <section className="erp-card">
          <h3>{selectedSupplier.supplierName}</h3>
          <div className="erp-table-wrap">
            <table className="erp-table compact">
              <thead>
                <tr>
                  <th aria-label="Select" />
                  <th>Ref</th>
                  <th>Invoice</th>
                  <th>Gross</th>
                  <th>TDS</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {selectedSupplier.invoices.map((inv) => {
                  const heldBy = invoicesInFlight.get(String(inv.documentId));
                  return (
                    <tr key={inv.documentId} className={heldBy ? 'erp-row-muted' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${inv.refNumber}`}
                          checked={selectedInvoiceIds.has(inv.documentId)}
                          onChange={() => toggleInvoice(inv.documentId)}
                          disabled={Boolean(heldBy)}
                          title={heldBy ? `Already in payment ${heldBy}` : undefined}
                        />
                      </td>
                      <td>
                        {inv.refNumber}
                        {heldBy && <div className="erp-cell-muted">In payment {heldBy}</div>}
                      </td>
                      <td>{inv.invoiceNumber}</td>
                      <td>{money(inv.grossAmount)}</td>
                      <td>{money(inv.tdsAmount)}</td>
                      <td>{money(inv.netAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="erp-form-actions">
            <button
              type="button"
              className="erp-btn primary"
              disabled={busy}
              onClick={preparePayment}
            >
              <Send size={14} /> Submit for approval
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default SupplierPayTab;
