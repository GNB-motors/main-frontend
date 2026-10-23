/**
 * Receipt entry & bill adjustment (ISOCL ERP Stage 12)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Banknote } from 'lucide-react';
import { toast } from 'react-toastify';
import ReceiptApi from './ReceiptService';
import PartyApi from '../ErpMasters/PartyService';
import PageShell from '../../components/Erp/PageShell';
import {
  draftForBill,
  toCnAllocations,
  allocationState,
  unadjustedTotal,
} from './receiptAllocation';
import { money } from './money';
import ReceiptForm from './sections/ReceiptForm';
import CnAllocationPanel from './sections/CnAllocationPanel';
import ShortageReport from './sections/ShortageReport';
import '../../styles/erp.css';

const todayInput = () => new Date().toISOString().slice(0, 10);

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
      // Financial view: only parties with a DO at the active location (scope=financial).
      const res = await PartyApi.getParties({ limit: 200, status: 'ACTIVE', scope: 'financial' });
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
    // Load the unadjusted queue up front so the summary tiles are populated on
    // every tab, not only once the user opens "Adjust to bills".
    loadUnadjusted();
  }, [loadParties, loadUnadjusted]);

  useEffect(() => {
    if (tab === 'report') loadReport();
  }, [tab, loadReport]);

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
    setCnDraft(draftForBill(bill));
  };

  const submitAdjustment = async () => {
    if (!selectedVoucherId || !selectedBillId || !context) return;
    const bill = context.bills.find((b) => b.billId === selectedBillId);
    if (!bill) return;
    // Client-side guard mirrors the live footer; the backend also rejects
    // over-allocation, but blocking here avoids a round-trip and a toast.
    if (!canPost) {
      toast.error('Fix the allocation before posting — it exceeds the receipt or the bill.');
      return;
    }

    const cnAllocations = toCnAllocations(bill, cnDraft);

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

  // Live allocation math — the "received / applied / remaining" the vision wants,
  // with partial and overpayment (customer-advance) states made explicit.
  const toAllocateTotal = unadjustedTotal(unadjusted);
  const voucherUnadjusted = context?.voucher?.unadjustedAmount || 0;
  const { allocatingForBill, remaining, overBill, overVoucher, canPost } = allocationState({
    voucherUnadjusted,
    bill: selectedBill,
    cnDraft,
  });

  return (
    <PageShell
      embedded={embedded}
      title={
        <>
          <Banknote size={22} /> Receipts &amp; Adjustment
        </>
      }
      subtitle="Record party receipts first, then CN-wise bill allocation when details arrive."
      breadcrumbs={[
        { label: 'ERP', to: '/erp' },
        { label: 'Billing', to: '/erp/billing' },
        { label: 'Receipts' },
      ]}
    >
      <div className="erp-buckets">
        <div className="erp-bucket">
          <span className="erp-bucket-count">{money(toAllocateTotal)}</span>
          <span className="erp-bucket-label">To allocate</span>
        </div>
        <div className="erp-bucket">
          <span className="erp-bucket-count">{unadjusted.length}</span>
          <span className="erp-bucket-label">Unadjusted receipts</span>
        </div>
      </div>

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
        <ReceiptForm
          receiptForm={receiptForm}
          setReceiptForm={setReceiptForm}
          parties={parties}
          busy={busy}
          submitReceipt={submitReceipt}
        />
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
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {(context.bills || []).map((b) => (
                      <tr key={b.billId}>
                        <td>{b.billNumber}</td>
                        <td>{money(b.outstandingAmount)}</td>
                        <td>
                          <button
                            type="button"
                            className="erp-btn small"
                            onClick={() => openBill(b)}
                          >
                            Allocate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedBill && (
                <CnAllocationPanel
                  selectedBill={selectedBill}
                  cnDraft={cnDraft}
                  setCnDraft={setCnDraft}
                  voucherUnadjusted={voucherUnadjusted}
                  allocatingForBill={allocatingForBill}
                  remaining={remaining}
                  overBill={overBill}
                  overVoucher={overVoucher}
                  busy={busy}
                  canPost={canPost}
                  submitAdjustment={submitAdjustment}
                  loadContext={loadContext}
                  selectedVoucherId={selectedVoucherId}
                />
              )}
            </section>
          )}
        </div>
      )}

      {tab === 'report' && (
        <ShortageReport exportReport={exportReport} loading={loading} reportRows={reportRows} />
      )}
    </PageShell>
  );
};

export default ReceiptsPage;
