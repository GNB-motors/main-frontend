/**
 * Receipt entry & bill adjustment (ISOCL ERP Stage 12)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Banknote, Download, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import ReceiptApi from './ReceiptService';
import PartyApi from '../ErpMasters/PartyService';
import '../../styles/erp.css';

const money = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

const todayInput = () => new Date().toISOString().slice(0, 10);

const emptyCnRow = () => ({
  amountReceived: 0,
  detentionDeducted: 0,
  shortageDeducted: 0,
  othersDeducted: 0,
  othersLabel: '',
  remarks: '',
});

const ReceiptsPage = () => {
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
      draft[cn.cnId] = {
        ...emptyCnRow(),
        detentionDeducted: cn.detentionAmount || 0,
        shortageDeducted: cn.shortageAmount || 0,
      };
    }
    setCnDraft(draft);
  };

  const lineTotal = (row) =>
    (Number(row.amountReceived) || 0)
    + (Number(row.detentionDeducted) || 0)
    + (Number(row.shortageDeducted) || 0)
    + (Number(row.othersDeducted) || 0);

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

  return (
    <div className="erp-page">
      <header className="erp-page-header">
        <div>
          <h1>
            <Banknote size={22} /> Receipts & Adjustment
          </h1>
          <p>Record party receipts first, then CN-wise bill allocation when details arrive.</p>
        </div>
      </header>

      <div className="erp-tabs">
        {[
          ['receipt', 'New receipt'],
          ['adjust', 'Adjust to bills'],
          ['report', 'Shortage & detention'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? 'active' : ''}
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
          <label>
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
        <div className="erp-split">
          <section className="erp-card">
            <h3>Unadjusted receipts</h3>
            {loading && <p>Loading…</p>}
            {!loading && unadjusted.length === 0 && <p>No unadjusted receipts.</p>}
            <ul className="erp-list">
              {unadjusted.map((v) => (
                <li key={v._id}>
                  <button type="button" className="erp-link-btn" onClick={() => loadContext(v._id)}>
                    {v.voucherNumber} — {v.partyName || ''} — {money(v.unadjustedAmount)} left
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {context && (
            <section className="erp-card">
              <h3>
                {context.voucher.voucherNumber} — {money(context.voucher.unadjustedAmount)}{' '}
                unadjusted
              </h3>
              <p>Select a bill, then allocate CN-wise.</p>
              <div className="erp-table-wrap">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Bill</th>
                      <th>Outstanding</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {(context.bills || []).map((b) => (
                      <tr key={b.billId}>
                        <td>{b.billNumber}</td>
                        <td>{money(b.outstandingAmount)}</td>
                        <td>
                          <button type="button" className="erp-btn small" onClick={() => openBill(b)}>
                            Allocate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedBill && (
                <>
                  <h4>CN allocation — {selectedBill.billNumber}</h4>
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
                      disabled={busy}
                      onClick={submitAdjustment}
                    >
                      Post adjustment
                    </button>
                    <button type="button" className="erp-btn" onClick={() => loadContext(selectedVoucherId)}>
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
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
  );
};

export default ReceiptsPage;
