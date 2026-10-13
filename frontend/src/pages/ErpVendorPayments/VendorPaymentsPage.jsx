/**
 * Vendor payment dashboard (ISOCL ERP Stage 13)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import VendorPaymentApi from './VendorPaymentService';
import PageShell from '../../components/Erp/PageShell';
import { money } from './money';
import VendorOutstandingTab from './sections/VendorOutstandingTab';
import VendorApprovalTab from './sections/VendorApprovalTab';
import VendorReleaseTab from './sections/VendorReleaseTab';
import VendorOnAccountModal from './sections/VendorOnAccountModal';
import VendorReleaseModal from './sections/VendorReleaseModal';
import '../../styles/erp.css';

const VendorPaymentsPage = ({ embedded = false }) => {
  const [tab, setTab] = useState('outstanding');
  const [groups, setGroups] = useState([]);
  const [pending, setPending] = useState([]);
  /* Payments raised but not yet approved. They belong to neither existing tab:
     `outstanding` lists bills, `release` lists APPROVED payments only. Without
     this the operator submits for approval and the payment vanishes until an
     approver acts on it. */
  const [awaitingApproval, setAwaitingApproval] = useState([]);
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

  const loadAwaitingApproval = useCallback(async () => {
    try {
      const res = await VendorPaymentApi.list({ status: 'PENDING_APPROVAL', limit: 100 });
      setAwaitingApproval(res.data || []);
    } catch {
      // A missing approval queue must not blank the page's main tabs.
      setAwaitingApproval([]);
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
    loadAwaitingApproval();
  }, [loadOutstanding, loadPending, loadAwaitingApproval]);

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
      const detail = (res.data || []).find((g) => String(g.vendorId) === String(group.vendorId));
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
    // The vendor row (from getOutstanding) already carries onAccountAvailable, so
    // only fetch the voucher list when there is a balance to apply. createPayment
    // re-validates any selected vouchers server-side regardless.
    if (!(selectedVendor.onAccountAvailable > 0)) {
      await submitPayment([]);
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

  /**
   * Bills already committed to an in-flight payment, mapped to the payment that
   * holds them. The server refuses a second payment against these
   * (_assertDocumentsAvailable), so offering them as selectable produced a hard
   * "Document already in payment VPMT-xxxx" naming a payment the UI never showed.
   */
  const billsInFlight = useMemo(() => {
    const m = new Map();
    for (const p of awaitingApproval) {
      for (const a of p.billAllocations || []) {
        if (a.documentId) m.set(String(a.documentId), p.paymentNumber);
      }
    }
    return m;
  }, [awaitingApproval]);

  const awaitingApprovalTotal = awaitingApproval.reduce((sum, p) => sum + (p.netPayable || 0), 0);

  return (
    <PageShell
      embedded={embedded}
      title={
        <>
          <Truck size={22} /> Vendor Payments
        </>
      }
      subtitle="Outstanding purchase bills → approval → bank release."
      breadcrumbs={[
        { label: 'ERP', to: '/erp' },
        { label: 'Payables', to: '/erp/payables' },
        { label: 'Vendor Payments' },
      ]}
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
        {[
          ['outstanding', 'Outstanding bills'],
          [
            'approval',
            `Awaiting approval${awaitingApproval.length ? ` (${awaitingApproval.length})` : ''}`,
          ],
          ['release', 'Pending release'],
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

      {tab === 'outstanding' && (
        <VendorOutstandingTab
          loading={loading}
          groups={groups}
          openVendor={openVendor}
          selectedVendor={selectedVendor}
          billsInFlight={billsInFlight}
          selectedBillIds={selectedBillIds}
          toggleBill={toggleBill}
          selectedTotal={selectedTotal}
          busy={busy}
          prepareSubmit={prepareSubmit}
        />
      )}

      {/* Raised, not yet approved. Read-only by design: nothing here can be
          released until an approver acts, so the page offers no action beyond
          seeing that the payment exists. */}
      {tab === 'approval' && (
        <VendorApprovalTab
          awaitingApproval={awaitingApproval}
          awaitingApprovalTotal={awaitingApprovalTotal}
        />
      )}

      {tab === 'release' && (
        <VendorReleaseTab loading={loading} pending={pending} setReleaseTarget={setReleaseTarget} />
      )}

      {showOnAccountPopup && onAccount && (
        <VendorOnAccountModal
          onAccount={onAccount}
          selectedVoucherIds={selectedVoucherIds}
          setSelectedVoucherIds={setSelectedVoucherIds}
          submitPayment={submitPayment}
          busy={busy}
          confirmOnAccount={confirmOnAccount}
        />
      )}

      {releaseTarget && (
        <VendorReleaseModal
          releaseTarget={releaseTarget}
          releaseForm={releaseForm}
          setReleaseForm={setReleaseForm}
          setReleaseTarget={setReleaseTarget}
          busy={busy}
          releasePayment={releasePayment}
        />
      )}
    </PageShell>
  );
};

export default VendorPaymentsPage;
