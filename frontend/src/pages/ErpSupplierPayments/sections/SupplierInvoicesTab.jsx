import React from 'react';
import { money } from '../money';

const SUPPLY_TYPES = ['TYRE', 'SPARE_PARTS', 'DIESEL', 'SERVICE', 'OTHER'];

function SupplierInvoicesTab({
  invoiceForm,
  setInvoiceForm,
  busy,
  submitInvoice,
  loading,
  invoices,
}) {
  return (
    <>
      <form className="erp-card erp-form-grid" onSubmit={submitInvoice}>
        <label>
          Supplier ID
          <input
            aria-label="Supplier ID"
            required
            value={invoiceForm.supplierId}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, supplierId: e.target.value })}
            placeholder="Paste supplier _id from masters"
          />
        </label>
        <label>
          Invoice no
          <input
            aria-label="Invoice no"
            required
            value={invoiceForm.invoiceNumber}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
          />
        </label>
        <label>
          Invoice date
          <input
            aria-label="Invoice date"
            type="date"
            required
            value={invoiceForm.invoiceDate}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
          />
        </label>
        <label>
          Type
          <select
            value={invoiceForm.supplyType}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, supplyType: e.target.value })}
          >
            {SUPPLY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Gross amount
          <input
            aria-label="Gross amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={invoiceForm.grossAmount}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, grossAmount: e.target.value })}
          />
        </label>
        <label>
          Taxable value
          <input
            aria-label="Taxable value"
            type="number"
            min="0"
            step="0.01"
            value={invoiceForm.taxableValue}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, taxableValue: e.target.value })}
          />
        </label>
        <label>
          GST %
          <input
            aria-label="GST %"
            type="number"
            min="0"
            value={invoiceForm.gstRate}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, gstRate: e.target.value })}
          />
        </label>
        <label>
          TDS %
          <input
            aria-label="TDS %"
            type="number"
            min="0"
            value={invoiceForm.tdsRate}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, tdsRate: e.target.value })}
          />
        </label>
        <label>
          Discount
          <input
            aria-label="Discount"
            type="number"
            min="0"
            value={invoiceForm.discount}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: e.target.value })}
          />
        </label>
        <label className="full-width">
          Description
          <input
            aria-label="Description"
            value={invoiceForm.description}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
          />
        </label>
        <div className="erp-form-actions full-width">
          <button type="submit" className="erp-btn primary" disabled={busy}>
            Save invoice
          </button>
        </div>
      </form>

      <section className="erp-card" style={{ marginTop: '1rem' }}>
        <h3>Recent invoices</h3>
        {loading && <p>Loading…</p>}
        <div className="erp-table-wrap">
          <table className="erp-table compact">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Invoice</th>
                <th>Supplier</th>
                <th>Net</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="erp-muted">
                    No supplier invoices yet.
                  </td>
                </tr>
              )}
              {invoices.map((i) => (
                <tr key={i._id}>
                  <td>{i.refNumber}</td>
                  <td>{i.invoiceNumber}</td>
                  <td>{i.supplierId?.name || '—'}</td>
                  <td>{money(i.netAmount)}</td>
                  <td>{i.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default SupplierInvoicesTab;
