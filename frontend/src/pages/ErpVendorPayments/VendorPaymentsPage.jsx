/**
 * Vendor payment dashboard (ISOCL ERP Stage 13)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Send, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import VendorPaymentApi from './VendorPaymentService';
import PageShell from '../../components/Erp/PageShell';
import StatusBadge from '../../components/Erp/StatusBadge';
import { formatDateIST } from '../../utils/dateUtils';
import '../../styles/erp.css';

const money = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

const VendorPaymentsPage = ({ embedded = false }) => {
  const [tab, setTab] = useState('outstanding');
  const [groups, setGroups] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedBillIds, setSelectedBillIds] = useState(new Set());
  const [onAccount, setOnAccount] = useState(null);
  const [selectedVoucherIds, setSelectedVoucherIds] = useState(new Set());
  const [showOnAccountPopup, setShowOnAccountPopup] = useState(false);

  const [releaseTarget, setReleaseTarget] = useState(null);
  const [releaseForm, setReleaseForm] = useState({
    paymentMode: 'NEFT',
    instrumentNo: '',
    bankName: '',
  });

  const loadOutstanding = useCallback(async () => {
    setLoading(true);
    try {
      const res = await VendorPaymentApi.getOutstanding();
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
      const res = await VendorPaymentApi.listPendingRelease();
      setPending(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'outstanding') loadOutstanding();
    else loadPending();
  }, [tab, loadOutstanding, loadPending]);

  // The vendor list no longer ships every vendor's bills — that payload was
  // unbounded and only the totals were rendered. Bills are fetched for the one
  // vendor being paid.
  const openVendor = async (group) => {
    setSelectedVendor({ ...group, bills: [] });
    setSelectedBillIds(new Set());
    setOnAccount(null);
    setSelectedVoucherIds(new Set());
    setBusy(true);
    try {
      const res = await VendorPaymentApi.getOutstanding({
        vendorId: group.vendorId,
        includeBills: true,
      });
      const detail = (res.data || []).find(
        (g) => String(g.vendorId) === String(group.vendorId),
      );
      setSelectedVendor(detail || { ...group, bills: [] });
    } catch (err) {
      toast.error(err.message);
      setSelectedVendor(null);
    } finally {
      setBusy(false);
    }
  };

  const toggleBill = (id) => {
    setSelectedBillIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const vendorBills = selectedVendor?.bills || [];
  const allSelected = vendorBills.length > 0 && vendorBills.every((b) => selectedBillIds.has(b.purchaseBillId));

  const toggleAll = () => {
    setSelectedBillIds(allSelected ? new Set() : new Set(vendorBills.map((b) => b.purchaseBillId)));
  };

  // Running total of the selection — you should never have to submit a payment
  // to find out what it comes to.
  const selectedTotal = vendorBills
    .filter((b) => selectedBillIds.has(b.purchaseBillId))
    .reduce((sum, b) => sum + (b.netAmount || 0), 0);

  const retryEmail = async (payment) => {
    try {
      await VendorPaymentApi.retryEmail(payment._id);
      toast.success('Payment advice re-sent');
      loadPending();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const prepareSubmit = async () => {
    if (!selectedVendor || selectedBillIds.size === 0) {
      toast.error('Select at least one bill');
      return;
    }
    try {
      const res = await VendorPaymentApi.checkOnAccount(selectedVendor.vendorId);
      setOnAccount(res.data);
      if (res.data?.available > 0) {
        setShowOnAccountPopup(true);
      } else {
        await submitPayment([]);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitPayment = async (voucherIds) => {
    setBusy(true);
    try {
      await VendorPaymentApi.create({
        vendorId: selectedVendor.vendorId,
        purchaseBillIds: [...selectedBillIds],
        onAccountVoucherIds: voucherIds,
      });
      toast.success('Payment submitted for approval');
      setShowOnAccountPopup(false);
      setSelectedVendor(null);
      loadOutstanding();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmOnAccount = () => {
    submitPayment([...selectedVoucherIds]);
  };

  const releasePayment = async () => {
    if (!releaseTarget) return;
    setBusy(true);
    try {
      await VendorPaymentApi.release(releaseTarget._id, releaseForm);
      toast.success('Payment released');
      setReleaseTarget(null);
      loadPending();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      embedded={embedded}
      title={<><Truck size={22} /> Vendor Payments</>}
      subtitle="Outstanding purchase bills → approval → bank release."
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Payables', to: '/erp/payables' }, { label: 'Vendor Payments' }]}
    >

      <div className="erp-tabs">
        {[['outstanding', 'Outstanding bills'], ['release', 'Pending release']].map(
          ([key, label]) => (
            <button
              key={key}
              type="button"
              className={`erp-tab ${tab === key ? 'active' : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {tab === 'outstanding' && (
        <div className="erp-split">
          <section className="erp-card">
            <h3>Vendors</h3>
            {loading && <p>Loading…</p>}
            <ul className="erp-list">
              {groups.map((g) => (
                <li key={g.vendorId}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="erp-link-btn" onClick={() => openVendor(g)}>
                      {g.vendorName} — {money(g.totalOutstanding)} ({g.billCount} bills)
                      {g.onAccountAvailable > 0 && ` · On-a/c ${money(g.onAccountAvailable)}`}
                      {g.podPendingCount > 0 && ` · POD pending ${g.podPendingCount}`}
                    </button>
                    <Link to={`/erp/accounts/vendor/${g.vendorId}`} className="erp-muted" style={{ fontSize: 12 }}>
                      ledger →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {selectedVendor && (
            <section className="erp-card">
              <h3>{selectedVendor.vendorName} — select bills</h3>
              <div className="erp-table-wrap">
                <table className="erp-table compact">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          aria-label="Select all bills"
                        />
                      </th>
                      <th>Bill</th>
                      <th>Trip</th>
                      <th>Vehicle</th>
                      <th style={{ textAlign: 'right' }}>Net</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVendor.bills.map((b) => (
                      <tr key={b.purchaseBillId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedBillIds.has(b.purchaseBillId)}
                            onChange={() => toggleBill(b.purchaseBillId)}
                          />
                        </td>
                        <td>{b.billNumber}</td>
                        <td>{b.tripNumber}</td>
                        <td>{b.vehicleNumber}</td>
                        <td className="erp-numeric" style={{ textAlign: 'right' }}>{money(b.netAmount)}</td>
                        <td>{b.dueDate ? formatDateIST(b.dueDate) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="erp-form-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14 }}>
                  {selectedBillIds.size} of {vendorBills.length} selected ·{' '}
                  <strong className="erp-numeric">{money(selectedTotal)}</strong>
                </span>
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
      )}

      {tab === 'release' && (
        <section className="erp-card">
          <h3>Approved — awaiting release</h3>
          {loading && <p>Loading…</p>}
          <ul className="erp-list">
            {pending.length === 0 && !loading && (
              <li className="erp-muted">Nothing awaiting release.</li>
            )}
            {pending.map((p) => (
              <li key={p._id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button type="button" className="erp-link-btn" onClick={() => setReleaseTarget(p)}>
                    {p.paymentNumber} — {money(p.netPayable)} net ({p.billAllocations?.length} bills)
                  </button>
                  {p.emailStatus === 'FAILED' && (
                    <>
                      <StatusBadge status="FAILED" label="Email failed" />
                      <button type="button" className="erp-btn small" onClick={() => retryEmail(p)}>
                        <Mail size={13} /> Retry email
                      </button>
                    </>
                  )}
                </div>
                {p.emailStatus === 'FAILED' && p.emailError && (
                  <div className="erp-callout danger" style={{ marginTop: 8, marginBottom: 0 }}>
                    {p.emailError}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {showOnAccountPopup && onAccount && (
        <div className="erp-modal-backdrop">
          <div className="erp-modal erp-card">
            <h3>Apply on-account ({money(onAccount.available)} available)</h3>
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
                Skip on-account
              </button>
              <button type="button" className="erp-btn primary" disabled={busy} onClick={confirmOnAccount}>
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
            <p>Net payable: {money(releaseTarget.netPayable)}</p>
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
            <label>
              Bank
              <input
                value={releaseForm.bankName}
                onChange={(e) => setReleaseForm({ ...releaseForm, bankName: e.target.value })}
              />
            </label>
            <div className="erp-form-actions">
              <button type="button" className="erp-btn" onClick={() => setReleaseTarget(null)}>
                Cancel
              </button>
              <button type="button" className="erp-btn primary" disabled={busy} onClick={releasePayment}>
                Release payment
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default VendorPaymentsPage;
