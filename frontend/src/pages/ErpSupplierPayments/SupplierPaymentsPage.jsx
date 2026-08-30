/**
 * Supplier invoices & payments (ISOCL ERP Stage 14)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Package, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { SupplierInvoiceApi, SupplierPaymentApi } from './SupplierPaymentService';
import PageShell from '../../components/Erp/PageShell';
import '../../styles/erp.css';

const money = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

const todayInput = () => new Date().toISOString().slice(0, 10);

const SUPPLY_TYPES = ['TYRE', 'SPARE_PARTS', 'DIESEL', 'SERVICE', 'OTHER'];

const SupplierPaymentsPage = ({ embedded = false }) => {
  const [tab, setTab] = useState('invoices');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [invoices, setInvoices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pending, setPending] = useState([]);

  const [invoiceForm, setInvoiceForm] = useState({
    supplierId: '',
    invoiceNumber: '',
    invoiceDate: todayInput(),
    supplyType: 'TYRE',
    description: '',
    grossAmount: '',
    taxableValue: '',
    gstRate: '0',
    tdsRate: '0',
    discount: '0',
  });

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState(new Set());
  const [onAccount, setOnAccount] = useState(null);
  const [selectedVoucherIds, setSelectedVoucherIds] = useState(new Set());
  const [showOnAccountPopup, setShowOnAccountPopup] = useState(false);

  const [releaseTarget, setReleaseTarget] = useState(null);
  const [releaseForm, setReleaseForm] = useState({
    paymentMode: 'NEFT',
    instrumentNo: '',
    bankName: '',
  });

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SupplierInvoiceApi.list({ limit: 100 });
      setInvoices(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOutstanding = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SupplierPaymentApi.getOutstanding();
      setGroups(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SupplierPaymentApi.listPendingRelease();
      setPending(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'invoices') loadInvoices();
    else if (tab === 'pay') loadOutstanding();
    else loadPending();
  }, [tab, loadInvoices, loadOutstanding, loadPending]);

  const submitInvoice = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await SupplierInvoiceApi.create({
        ...invoiceForm,
        grossAmount: Number(invoiceForm.grossAmount),
        taxableValue: invoiceForm.taxableValue ? Number(invoiceForm.taxableValue) : undefined,
        gstRate: Number(invoiceForm.gstRate),
        tdsRate: Number(invoiceForm.tdsRate),
        discount: Number(invoiceForm.discount),
      });
      toast.success('Supplier invoice recorded');
      setInvoiceForm((f) => ({ ...f, invoiceNumber: '', grossAmount: '', description: '' }));
      loadInvoices();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Invoices are fetched per supplier — the list view only needs the totals,
  // and shipping every supplier's invoices was an unbounded payload.
  const openSupplier = async (group) => {
    setSelectedSupplier({ ...group, invoices: [] });
    setSelectedInvoiceIds(new Set());
    setBusy(true);
    try {
      const res = await SupplierPaymentApi.getOutstanding({
        supplierId: group.supplierId,
        includeInvoices: true,
      });
      const detail = (res.data || []).find(
        (g) => String(g.supplierId) === String(group.supplierId),
      );
      setSelectedSupplier(detail || { ...group, invoices: [] });
    } catch (err) {
      toast.error(err.message);
      setSelectedSupplier(null);
    } finally {
      setBusy(false);
    }
  };

  const toggleInvoice = (id) => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const preparePayment = async () => {
    if (!selectedSupplier || selectedInvoiceIds.size === 0) {
      toast.error('Select at least one invoice');
      return;
    }
    try {
      const res = await SupplierPaymentApi.checkOnAccount(selectedSupplier.supplierId);
      setOnAccount(res.data);
      if (res.data?.available > 0) setShowOnAccountPopup(true);
      else submitPayment([]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitPayment = async (voucherIds) => {
    setBusy(true);
    try {
      await SupplierPaymentApi.create({
        supplierId: selectedSupplier.supplierId,
        supplierInvoiceIds: [...selectedInvoiceIds],
        onAccountVoucherIds: voucherIds,
      });
      toast.success('Supplier payment submitted for approval');
      setShowOnAccountPopup(false);
      setSelectedSupplier(null);
      loadOutstanding();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const releasePayment = async () => {
    if (!releaseTarget) return;
    setBusy(true);
    try {
      await SupplierPaymentApi.release(releaseTarget._id, releaseForm);
      toast.success('Payment released');
      setReleaseTarget(null);
      loadPending();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const supplierOptions = [...new Map(
    invoices
      .filter((i) => i.supplierId?._id || i.supplierId)
      .map((i) => {
        const s = i.supplierId;
        const id = s._id || s;
        return [String(id), { id, name: s.name || 'Supplier', code: s.code || '' }];
      }),
  ).values()];

  return (
    <PageShell
      embedded={embedded}
      title={<><Package size={22} /> Supplier Invoices &amp; Payments</>}
      subtitle="Manual supplier invoices, then the same approval → release flow as vendor payments."
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Payables', to: '/erp/payables' }, { label: 'Supplier Payments' }]}
    >

      <div className="erp-tabs">
        {[
          ['invoices', 'New invoice'],
          ['pay', 'Pay suppliers'],
          ['release', 'Pending release'],
        ].map(([key, label]) => (
          <button key={key} type="button" className={`erp-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'invoices' && (
        <>
          <form className="erp-card erp-form-grid" onSubmit={submitInvoice}>
            <label>
              Supplier ID
              <input
                required
                value={invoiceForm.supplierId}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, supplierId: e.target.value })}
                placeholder="Paste supplier _id from masters"
              />
            </label>
            <label>
              Invoice no
              <input
                required
                value={invoiceForm.invoiceNumber}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
              />
            </label>
            <label>
              Invoice date
              <input
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
                type="number"
                min="0"
                value={invoiceForm.gstRate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, gstRate: e.target.value })}
              />
            </label>
            <label>
              TDS %
              <input
                type="number"
                min="0"
                value={invoiceForm.tdsRate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, tdsRate: e.target.value })}
              />
            </label>
            <label>
              Discount
              <input
                type="number"
                min="0"
                value={invoiceForm.discount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: e.target.value })}
              />
            </label>
            <label className="full-width">
              Description
              <input
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
                      <td colSpan={5} className="erp-muted">No supplier invoices yet.</td>
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
      )}

      {tab === 'pay' && (
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
                      <th />
                      <th>Ref</th>
                      <th>Invoice</th>
                      <th>Gross</th>
                      <th>TDS</th>
                      <th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSupplier.invoices.map((inv) => (
                      <tr key={inv.documentId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedInvoiceIds.has(inv.documentId)}
                            onChange={() => toggleInvoice(inv.documentId)}
                          />
                        </td>
                        <td>{inv.refNumber}</td>
                        <td>{inv.invoiceNumber}</td>
                        <td>{money(inv.grossAmount)}</td>
                        <td>{money(inv.tdsAmount)}</td>
                        <td>{money(inv.netAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="erp-form-actions">
                <button type="button" className="erp-btn primary" disabled={busy} onClick={preparePayment}>
                  <Send size={14} /> Submit for approval
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {tab === 'release' && (
        <section className="erp-card">
          <h3>Approved supplier payments</h3>
          {loading && <p>Loading…</p>}
          {!loading && pending.length === 0 && (
            <p className="erp-muted">No approved supplier payments awaiting release.</p>
          )}
          {!loading && pending.length > 0 && (
            <ul className="erp-list">
              {pending.map((p) => (
                <li key={p._id}>
                  <button type="button" className="erp-link-btn" onClick={() => setReleaseTarget(p)}>
                    {p.paymentNumber} — {money(p.netPayable)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {showOnAccountPopup && onAccount && (
        <div className="erp-modal-backdrop">
          <div className="erp-modal erp-card">
            <h3>Apply on-account ({money(onAccount.available)})</h3>
            <ul className="erp-list">
              {(onAccount.vouchers || []).map((v) => (
                <li key={v.voucherId}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedVoucherIds.has(v.voucherId)}
                      onChange={() =>
                        setSelectedVoucherIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(v.voucherId)) next.delete(v.voucherId);
                          else next.add(v.voucherId);
                          return next;
                        })
                      }
                    />
                    {v.voucherNumber} — {money(v.unadjustedAmount)}
                  </label>
                </li>
              ))}
            </ul>
            <div className="erp-form-actions">
              <button type="button" className="erp-btn" onClick={() => submitPayment([])}>
                Skip
              </button>
              <button type="button" className="erp-btn primary" disabled={busy} onClick={() => submitPayment([...selectedVoucherIds])}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {releaseTarget && (
        <div className="erp-modal-backdrop">
          <div className="erp-modal erp-card">
            <h3>Release {releaseTarget.paymentNumber}</h3>
            <label>
              Mode
              <select
                value={releaseForm.paymentMode}
                onChange={(e) => setReleaseForm({ ...releaseForm, paymentMode: e.target.value })}
              >
                {['NEFT', 'RTGS', 'CHEQUE', 'UPI', 'BANK', 'CASH'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Instrument no
              <input
                value={releaseForm.instrumentNo}
                onChange={(e) => setReleaseForm({ ...releaseForm, instrumentNo: e.target.value })}
              />
            </label>
            <div className="erp-form-actions">
              <button type="button" className="erp-btn" onClick={() => setReleaseTarget(null)}>
                Cancel
              </button>
              <button type="button" className="erp-btn primary" disabled={busy} onClick={releasePayment}>
                Release
              </button>
            </div>
          </div>
        </div>
      )}

      {supplierOptions.length > 0 && tab === 'invoices' && (
        <p className="erp-hint">Known suppliers from recent invoices: {supplierOptions.map((s) => s.name).join(', ')}</p>
      )}
    </PageShell>
  );
};

export default SupplierPaymentsPage;
