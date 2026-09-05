/**
 * Vendor payment dashboard (ISOCL ERP Stage 13)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import VendorPaymentApi from './VendorPaymentService';
import PageShell from '../../components/Erp/PageShell';
import StatusBadge from '../../components/Erp/StatusBadge';
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

  // Load both queues up front so the KPI tiles are accurate regardless of the
  // open tab; switching tabs then just reveals already-loaded data.
  useEffect(() => {
    loadOutstanding();
    loadPending();
  }, [loadOutstanding, loadPending]);

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
      loadPending();
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
      loadOutstanding();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const readyToPay = groups.reduce((s, g) => s + (g.totalOutstanding || 0), 0);
  const awaitingRelease = pending.reduce((s, p) => s + (p.netPayable || 0), 0);
  const selectedTotal = selectedVendor
    ? (selectedVendor.bills || [])
      .filter((b) => selectedBillIds.has(b.purchaseBillId))
      .reduce((s, b) => s + (b.netAmount || 0), 0)
    : 0;

  return (
    <PageShell
      embedded={embedded}
      title={<><Truck size={22} /> Vendor Payments</>}
      subtitle="Outstanding purchase bills → approval → bank release."
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Payables', to: '/erp/payables' }, { label: 'Vendor Payments' }]}
    >

      <div className="erp-buckets">
        <div className="erp-bucket">
          <span className="erp-bucket-count">{money(readyToPay)}</span>
          <span className="erp-bucket-label">Ready to pay</span>
        </div>
        <div className="erp-bucket">
          <span className="erp-bucket-count">{groups.length}</span>
          <span className="erp-bucket-label">Vendors</span>
        </div>
        <div className="erp-bucket">
          <span className="erp-bucket-count">{money(awaitingRelease)}</span>
          <span className="erp-bucket-label">Awaiting release</span>
        </div>
        <div className="erp-bucket">
          <span className="erp-bucket-count">{pending.length}</span>
          <span className="erp-bucket-label">To release</span>
        </div>
      </div>

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
                      <th />
                      <th>Bill</th>
                      <th>Trip</th>
                      <th>Route</th>
                      <th>Net</th>
                      <th>Due</th>
                      <th>Ageing</th>
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
                        <td>
                          <div className="erp-cell-strong">{b.billNumber}</div>
                          <div className="erp-cell-muted">{b.vehicleNumber}</div>
                        </td>
                        <td>{b.tripNumber}</td>
                        <td className="erp-cell-muted">{b.route || '—'}</td>
                        <td>{money(b.netAmount)}</td>
                        <td>{b.dueDate?.slice?.(0, 10) || '—'}</td>
                        <td>
                          {b.ageingBucket
                            ? <StatusBadge status={b.ageingBucket} label={`${b.overdueDays ?? 0}d`} />
                            : '—'}
                        </td>
                      </tr>
                    ))}
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
                <button type="button" className="erp-btn primary" disabled={busy || selectedBillIds.size === 0} onClick={prepareSubmit}>
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
          {!loading && pending.length === 0 && (
            <p className="erp-muted">No payments awaiting release.</p>
          )}
          {!loading && pending.length > 0 && (
            <ul className="erp-list">
              {pending.map((p) => (
                <li key={p._id}>
                  <button type="button" className="erp-link-btn" onClick={() => setReleaseTarget(p)}>
                    {p.paymentNumber} — {money(p.netPayable)} net ({p.billAllocations?.length} bills)
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
