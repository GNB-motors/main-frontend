/**
 * Receipt entry & bill adjustment (ISOCL ERP Stage 12)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Banknote, Download, RefreshCw, Info, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import ReceiptApi from './ReceiptService';
import PartyApi from '../ErpMasters/PartyService';
import PageShell from '../../components/Erp/PageShell';
import { toISTDateString } from '../../utils/dateUtils';
import '../../styles/erp.css';
import '../../styles/erp-billing.css';

const money = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

// IST, not UTC: a UTC slice is off by one day for the 5.5 hours after IST
// midnight — exactly when an early-shift entry would be made.
const todayInput = () => toISTDateString(new Date());

const emptyCnRow = () => ({
  amountReceived: 0,
  detentionDeducted: 0,
  shortageDeducted: 0,
  othersDeducted: 0,
  othersLabel: '',
  remarks: '',
});

const ReceiptsPage = ({ embedded = false }) => {
  const [tab, setTab] = useState('receipt');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [parties, setParties] = useState([]);
  const [receiptForm, setReceiptForm] = useState({
    partyId: '',
    amount: '',
    receiptDate: todayInput(),
    mode: 'NEFT',
    instrumentNo: '',
    bankName: '',
    narration: '',
  });

  const [unadjusted, setUnadjusted] = useState([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState('');
  const [context, setContext] = useState(null);
  const [cnDraft, setCnDraft] = useState({});
  const [selectedBillId, setSelectedBillId] = useState('');

  const [reportRows, setReportRows] = useState([]);

  const loadParties = useCallback(async () => {
    try {
      const res = await PartyApi.getParties({ limit: 200, status: 'ACTIVE' });
      setParties(res.data || []);
    } catch {
      setParties([]);
    }
  }, []);

  const loadUnadjusted = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ReceiptApi.listUnadjusted({ limit: 100 });
      setUnadjusted(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setUnadjusted([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ReceiptApi.shortageDetentionReport({});
      setReportRows(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setReportRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  useEffect(() => {
    if (tab === 'adjust') loadUnadjusted();
    if (tab === 'report') loadReport();
  }, [tab, loadUnadjusted, loadReport]);

  const submitReceipt = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await ReceiptApi.create({
        ...receiptForm,
        amount: Number(receiptForm.amount),
      });
      toast.success('Receipt recorded — stays unadjusted until you allocate');
      setReceiptForm((f) => ({ ...f, amount: '', instrumentNo: '', narration: '' }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const loadContext = async (voucherId) => {
    setSelectedVoucherId(voucherId);
    setSelectedBillId('');
    setCnDraft({});
    setLoading(true);
    try {
      const res = await ReceiptApi.getAdjustmentContext(voucherId);
      setContext(res.data);
    } catch (err) {
      toast.error(err.message);
      setContext(null);
    } finally {
      setLoading(false);
    }
  };

  const openBill = (bill) => {
    setSelectedBillId(bill.billId);
    const draft = {};
    for (const cn of bill.cns || []) {
      // Deductions start EMPTY, never prefilled from the unloading.
      //
      // The bill's outstanding is already net of the shortage/detention that
      // were applied at unloading. Prefilling them here counts them a second
      // time, so the line total always exceeded the outstanding and the post
      // was rejected ("allocation 236400 exceeds outstanding 236376").
      //
      // These fields are only for deductions the CUSTOMER takes at payment
      // time, which we have not already netted off.
      draft[cn.cnId] = emptyCnRow();
    }
    setCnDraft(draft);
  };

  /** What this row settles against the bill: cash + any customer deductions. */
  const lineTotal = (row) =>
    (Number(row.amountReceived) || 0)
    + (Number(row.detentionDeducted) || 0)
    + (Number(row.shortageDeducted) || 0)
    + (Number(row.othersDeducted) || 0);

  /** Put the whole remaining outstanding on the first CN — the common case. */
  const fillRemaining = () => {
    if (!selectedBill) return;
    const cns = selectedBill.cns || [];
    if (!cns.length) return;
    const cap = Math.min(
      selectedBill.outstandingAmount || 0,
      context?.voucher?.unadjustedAmount ?? Infinity,
    );
    const next = { ...cnDraft };
    cns.forEach((cn, i) => {
      next[cn.cnId] = { ...(next[cn.cnId] || emptyCnRow()), amountReceived: i === 0 ? cap : 0 };
    });
    setCnDraft(next);
  };

  const submitAdjustment = async () => {
    if (!selectedVoucherId || !selectedBillId || !context) return;
    const bill = context.bills.find((b) => b.billId === selectedBillId);
    if (!bill) return;

    const cnAllocations = (bill.cns || []).map((cn) => ({
      cnId: cn.cnId,
      ...cnDraft[cn.cnId],
      amountReceived: Number(cnDraft[cn.cnId]?.amountReceived) || 0,
      detentionDeducted: Number(cnDraft[cn.cnId]?.detentionDeducted) || 0,
      shortageDeducted: Number(cnDraft[cn.cnId]?.shortageDeducted) || 0,
      othersDeducted: Number(cnDraft[cn.cnId]?.othersDeducted) || 0,
    }));

    setBusy(true);
    try {
      await ReceiptApi.createAdjustment({
        voucherId: selectedVoucherId,
        adjustmentDate: todayInput(),
        billAllocations: [{ billId: selectedBillId, cnAllocations }],
      });
      toast.success('Adjustment posted');
      await loadContext(selectedVoucherId);
      await loadUnadjusted();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const exportReport = async () => {
    try {
      const blob = await ReceiptApi.exportReportCsv({});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shortage-detention-report.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const selectedBill = context?.bills?.find((b) => b.billId === selectedBillId);

  // Party name for the detail header — voucher context first, then the picked
  // list row as a fallback (the row drops off `unadjusted` once fully adjusted).
  const selectedReceipt = unadjusted.find((v) => v._id === selectedVoucherId) || null;
  const selectedPartyName = context?.voucher?.partyName || selectedReceipt?.partyName || '';

  // Live totals so over-allocation is visible before posting, not after the
  // server rejects it. The backend guards both limits; this mirrors them.
  const allocatedTotal = (selectedBill?.cns || []).reduce(
    (sum, cn) => sum + lineTotal(cnDraft[cn.cnId] || emptyCnRow()),
    0,
  );
  const overBill = selectedBill
    ? allocatedTotal > (selectedBill.outstandingAmount || 0) + 1e-9
    : false;
  const overReceipt = context
    ? allocatedTotal > (context.voucher.unadjustedAmount || 0) + 1e-9
    : false;
  const nothingAllocated = allocatedTotal <= 0;

  return (
    <PageShell
      embedded={embedded}
      title={<><Banknote size={22} /> Receipts &amp; Adjustment</>}
      subtitle="Record party receipts first, then CN-wise bill allocation when details arrive."
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Billing', to: '/erp/billing' }, { label: 'Receipts' }]}
    >
      <div className="bill-redesign">
      <div className="erp-tabs">
        {[
          ['receipt', 'New receipt'],
          ['adjust', 'Adjust to bills'],
          ['report', 'Shortage & detention'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`erp-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'receipt' && (
        <form className="erp-card erp-form-grid" onSubmit={submitReceipt}>
          <label>
            Party
            <select
              required
              value={receiptForm.partyId}
              onChange={(e) => setReceiptForm({ ...receiptForm, partyId: e.target.value })}
            >
              <option value="">Select party</option>
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </label>
          <label className="bill-amount-field">
            Amount
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={receiptForm.amount}
              onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
            />
          </label>
          <label>
            Receipt date
            <input
              type="date"
              required
              value={receiptForm.receiptDate}
              onChange={(e) => setReceiptForm({ ...receiptForm, receiptDate: e.target.value })}
            />
          </label>
          <label>
            Mode
            <select
              value={receiptForm.mode}
              onChange={(e) => setReceiptForm({ ...receiptForm, mode: e.target.value })}
            >
              {['CASH', 'BANK', 'CHEQUE', 'UPI', 'NEFT', 'RTGS'].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            Instrument no
            <input
              value={receiptForm.instrumentNo}
              onChange={(e) => setReceiptForm({ ...receiptForm, instrumentNo: e.target.value })}
            />
          </label>
          <label>
            Bank
            <input
              value={receiptForm.bankName}
              onChange={(e) => setReceiptForm({ ...receiptForm, bankName: e.target.value })}
            />
          </label>
          <label className="full-width">
            Narration
            <input
              value={receiptForm.narration}
              onChange={(e) => setReceiptForm({ ...receiptForm, narration: e.target.value })}
            />
          </label>
          <div className="erp-form-actions full-width">
            <button type="submit" className="erp-btn primary" disabled={busy}>
              Record receipt
            </button>
          </div>
        </form>
      )}

      {tab === 'adjust' && (
        <div className="adjust-workspace">
          <aside className="adjust-master">
            <div className="adjust-panel-head">
              <h3>Unadjusted receipts</h3>
            </div>
            <div className="adjust-receipt-list">
              {loading && <p className="erp-muted adjust-hint">Loading…</p>}
              {!loading && unadjusted.length === 0 && (
                <p className="erp-muted adjust-hint">No unadjusted receipts.</p>
              )}
              {unadjusted.map((v) => (
                <button
                  type="button"
                  key={v._id}
                  className={`adjust-receipt-item ${selectedVoucherId === v._id ? 'selected' : ''}`}
                  onClick={() => loadContext(v._id)}
                >
                  <span className="adjust-receipt-no">{v.voucherNumber}</span>
                  <span className="adjust-receipt-party">{v.partyName || '—'}</span>
                  <span className="adjust-receipt-amt">
                    {money(v.unadjustedAmount)} <span>left</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="adjust-detail">
            {!context ? (
              <div className="adjust-empty">
                <FileText size={40} />
                <h4>Select a receipt</h4>
                <p>Choose an unadjusted receipt to view bills available for allocation.</p>
              </div>
            ) : (
              <>
                <div className="adjust-detail-head">
                  <div className="adjust-detail-id">
                    <div className="adjust-detail-no">{context.voucher.voucherNumber}</div>
                    <div className="adjust-detail-party">{selectedPartyName || '—'}</div>
                  </div>
                  <div className="adjust-detail-amount">
                    <div className="adjust-amount-value">
                      {money(context.voucher.unadjustedAmount)}
                    </div>
                    <div className="adjust-amount-label">Unadjusted amount</div>
                  </div>
                </div>
                <p className="adjust-detail-desc">Select a bill to allocate this receipt.</p>

                <div className="adjust-bills">
                  <div className="adjust-section-head">Available bills</div>
                  <div className="erp-table-wrap">
                    <table className="erp-table adjust-bills-table">
                      <thead>
                        <tr>
                          <th>Bill</th>
                          <th>Outstanding</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(context.bills || []).length === 0 ? (
                          <tr>
                            <td colSpan={3} className="erp-muted">
                              No open bills for this party.
                            </td>
                          </tr>
                        ) : (
                          (context.bills || []).map((b) => (
                            <tr
                              key={b.billId}
                              className={selectedBillId === b.billId ? 'active' : ''}
                            >
                              <td>{b.billNumber}</td>
                              <td>{money(b.outstandingAmount)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="erp-btn erp-btn-primary small"
                                  onClick={() => openBill(b)}
                                >
                                  Allocate
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedBill && (
                  <div className="adjust-alloc">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                    <h4 style={{ margin: '16px 0 8px' }}>CN allocation — {selectedBill.billNumber}</h4>
                    <button type="button" className="erp-btn small" onClick={fillRemaining}>
                      Settle in full
                    </button>
                  </div>

                  <div className="erp-callout info" style={{ marginBottom: 12 }}>
                    <Info size={15} />
                    <span>
                      <strong>Received</strong> is cash actually banked.{' '}
                      <strong>Shortage / detention / others</strong> are only for amounts the
                      customer deducted <em>on top of</em> the bill — anything already netted off at
                      unloading is inside the outstanding figure and must not be entered again.
                      Each row&apos;s <strong>Line</strong> = received + deductions, and the total
                      cannot exceed the bill&apos;s outstanding.
                    </span>
                  </div>

                  <div className="erp-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 12 }}>
                    <div className="erp-stat">
                      <div className="erp-stat-label">Bill outstanding</div>
                      <div className="erp-stat-value" style={{ fontSize: 18 }}>
                        {money(selectedBill.outstandingAmount)}
                      </div>
                    </div>
                    <div className="erp-stat">
                      <div className="erp-stat-label">Allocating</div>
                      <div className="erp-stat-value" style={{ fontSize: 18, color: overBill || overReceipt ? '#b91c1c' : undefined }}>
                        {money(allocatedTotal)}
                      </div>
                    </div>
                    <div className="erp-stat">
                      <div className="erp-stat-label">Bill left after</div>
                      <div className="erp-stat-value" style={{ fontSize: 18 }}>
                        {money(Math.max(0, (selectedBill.outstandingAmount || 0) - allocatedTotal))}
                      </div>
                    </div>
                    <div className="erp-stat">
                      <div className="erp-stat-label">Receipt left after</div>
                      <div className="erp-stat-value" style={{ fontSize: 18, color: overReceipt ? '#b91c1c' : undefined }}>
                        {money((context.voucher.unadjustedAmount || 0) - allocatedTotal)}
                      </div>
                    </div>
                  </div>

                  {(overBill || overReceipt) && (
                    <div className="erp-callout danger" style={{ marginBottom: 12 }}>
                      <AlertTriangle size={15} />
                      <span>
                        {overBill && `Allocating ${money(allocatedTotal)} exceeds the bill's outstanding ${money(selectedBill.outstandingAmount)}. `}
                        {overReceipt && `Allocating ${money(allocatedTotal)} exceeds the ${money(context.voucher.unadjustedAmount)} left on this receipt. `}
                        Reduce the amounts before posting.
                      </span>
                    </div>
                  )}
                  <div className="erp-table-wrap">
                    <table className="erp-table compact">
                      <thead>
                        <tr>
                          <th>CN</th>
                          <th>Received</th>
                          <th>Shortage</th>
                          <th>Detention</th>
                          <th>Others</th>
                          <th>Label</th>
                          <th>Remarks</th>
                          <th>Line</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedBill.cns || []).map((cn) => {
                          const row = cnDraft[cn.cnId] || emptyCnRow();
                          return (
                            <tr key={cn.cnId}>
                              <td>{cn.cnNumber}</td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={row.amountReceived}
                                  onChange={(e) =>
                                    setCnDraft({
                                      ...cnDraft,
                                      [cn.cnId]: { ...row, amountReceived: e.target.value },
                                    })
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={row.shortageDeducted}
                                  onChange={(e) =>
                                    setCnDraft({
                                      ...cnDraft,
                                      [cn.cnId]: { ...row, shortageDeducted: e.target.value },
                                    })
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={row.detentionDeducted}
                                  onChange={(e) =>
                                    setCnDraft({
                                      ...cnDraft,
                                      [cn.cnId]: { ...row, detentionDeducted: e.target.value },
                                    })
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={row.othersDeducted}
                                  onChange={(e) =>
                                    setCnDraft({
                                      ...cnDraft,
                                      [cn.cnId]: { ...row, othersDeducted: e.target.value },
                                    })
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  value={row.othersLabel}
                                  onChange={(e) =>
                                    setCnDraft({
                                      ...cnDraft,
                                      [cn.cnId]: { ...row, othersLabel: e.target.value },
                                    })
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  value={row.remarks}
                                  onChange={(e) =>
                                    setCnDraft({
                                      ...cnDraft,
                                      [cn.cnId]: { ...row, remarks: e.target.value },
                                    })
                                  }
                                />
                              </td>
                              <td>{money(lineTotal(row))}</td>
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
                      disabled={busy || overBill || overReceipt || nothingAllocated}
                      onClick={submitAdjustment}
                      title={
                        nothingAllocated ? 'Enter an amount to allocate first'
                          : (overBill || overReceipt) ? 'Reduce the allocation first' : ''
                      }
                    >
                      Post adjustment
                    </button>
                    <button type="button" className="erp-btn" onClick={() => loadContext(selectedVoucherId)}>
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {tab === 'report' && (
        <section className="erp-card">
          <div className="erp-page-header" style={{ marginBottom: '1rem' }}>
            <h3>Shortage & detention (party vs company)</h3>
            <button type="button" className="erp-btn" onClick={exportReport}>
              <Download size={14} /> CSV
            </button>
          </div>
          {loading && <p>Loading…</p>}
          {!loading && (
            <div className="erp-table-wrap">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Party</th>
                    <th>Bill</th>
                    <th>CN</th>
                    <th>Co. shortage</th>
                    <th>Party shortage</th>
                    <th>Co. detention</th>
                    <th>Party detention</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((r, i) => (
                    <tr key={`${r.adjustmentNumber}-${r.cnNumber}-${i}`}>
                      <td>{r.adjustmentDate?.slice?.(0, 10) || '—'}</td>
                      <td>{r.partyName}</td>
                      <td>{r.billNumber}</td>
                      <td>{r.cnNumber}</td>
                      <td>{money(r.companyShortage)}</td>
                      <td>{money(r.partyShortage)}</td>
                      <td>{money(r.companyDetention)}</td>
                      <td>{money(r.partyDetention)}</td>
                      <td>{r.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      </div>
    </PageShell>
  );
};

export default ReceiptsPage;
