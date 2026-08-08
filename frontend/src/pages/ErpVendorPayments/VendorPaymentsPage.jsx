/**
 * Vendor payment dashboard (ISOCL ERP Stage 13)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import VendorPaymentApi from './VendorPaymentService';
import '../../styles/erp.css';

const money = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

const VendorPaymentsPage = () => {
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

  const openVendor = (group) => {
    setSelectedVendor(group);
    setSelectedBillIds(new Set());
    setOnAccount(null);
    setSelectedVoucherIds(new Set());
  };

  const toggleBill = (id) => {
    setSelectedBillIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
    <div className="erp-page">
      <header className="erp-page-header">
        <div>
          <h1>
            <Truck size={22} /> Vendor Payments
          </h1>
          <p>Outstanding purchase bills → approval → bank release.</p>
        </div>
      </header>

      <div className="erp-tabs">
        {[['outstanding', 'Outstanding bills'], ['release', 'Pending release']].map(
          ([key, label]) => (
            <button
              key={key}
              type="button"
              className={tab === key ? 'active' : ''}
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
                  <button type="button" className="erp-link-btn" onClick={() => openVendor(g)}>
                    {g.vendorName} — {money(g.totalOutstanding)} ({g.billCount} bills)
                    {g.onAccountAvailable > 0 && ` · On-a/c ${money(g.onAccountAvailable)}`}
                    {g.podPendingCount > 0 && ` · POD pending ${g.podPendingCount}`}
                  </button>
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
                      <th />
                      <th>Bill</th>
                      <th>Trip</th>
                      <th>Vehicle</th>
                      <th>Net</th>
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
                        <td>{money(b.netAmount)}</td>
                        <td>{b.dueDate?.slice?.(0, 10) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="erp-form-actions">
                <button type="button" className="erp-btn primary" disabled={busy} onClick={prepareSubmit}>
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
            {pending.map((p) => (
              <li key={p._id}>
                <button type="button" className="erp-link-btn" onClick={() => setReleaseTarget(p)}>
                  {p.paymentNumber} — {money(p.netPayable)} net ({p.billAllocations?.length} bills)
                </button>
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
    </div>
  );
};

export default VendorPaymentsPage;
