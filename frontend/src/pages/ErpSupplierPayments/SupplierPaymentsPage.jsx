/**
 * Supplier invoices & payments (ISOCL ERP Stage 14)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Package } from 'lucide-react';
import { toast } from 'react-toastify';
import { SupplierInvoiceApi, SupplierPaymentApi } from './SupplierPaymentService';
import PageShell from '../../components/Erp/PageShell';
import SupplierInvoicesTab from './sections/SupplierInvoicesTab';
import SupplierPayTab from './sections/SupplierPayTab';
import SupplierApprovalTab from './sections/SupplierApprovalTab';
import SupplierReleaseTab from './sections/SupplierReleaseTab';
import SupplierOnAccountModal from './sections/SupplierOnAccountModal';
import SupplierReleaseModal from './sections/SupplierReleaseModal';
import '../../styles/erp.css';

const todayInput = () => new Date().toISOString().slice(0, 10);

const SupplierPaymentsPage = ({ embedded = false }) => {
  const [tab, setTab] = useState('invoices');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [invoices, setInvoices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pending, setPending] = useState([]);
  /* Raised but not yet approved — invisible before this: `pay` lists invoices
     and `release` lists APPROVED payments only. */
  const [awaitingApproval, setAwaitingApproval] = useState([]);

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

  const loadAwaitingApproval = useCallback(async () => {
    try {
      const res = await SupplierPaymentApi.list({ status: 'PENDING_APPROVAL', limit: 100 });
      setAwaitingApproval(res.data || []);
    } catch {
      setAwaitingApproval([]);
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
    else if (tab === 'release') loadPending();
  }, [tab, loadInvoices, loadOutstanding, loadPending]);

  // Needed by the `pay` tab too (to mark committed invoices), so it is not
  // gated on the approval tab being open.
  useEffect(() => {
    loadAwaitingApproval();
  }, [loadAwaitingApproval, tab]);

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
    // The supplier row already carries onAccountAvailable — only fetch the
    // voucher list when there is a balance to apply. The shared createPayment
    // re-validates selected vouchers server-side either way.
    if (!(selectedSupplier.onAccountAvailable > 0)) {
      await submitPayment([]);
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

  const supplierOptions = [
    ...new Map(
      invoices
        .filter((i) => i.supplierId?._id || i.supplierId)
        .map((i) => {
          const s = i.supplierId;
          const id = s._id || s;
          return [String(id), { id, name: s.name || 'Supplier', code: s.code || '' }];
        }),
    ).values(),
  ];

  /** Invoices already committed to an in-flight payment → the payment holding them. */
  const invoicesInFlight = useMemo(() => {
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
          <Package size={22} /> Supplier Invoices &amp; Payments
        </>
      }
      subtitle="Manual supplier invoices, then the same approval → release flow as vendor payments."
      breadcrumbs={[
        { label: 'ERP', to: '/erp' },
        { label: 'Payables', to: '/erp/payables' },
        { label: 'Supplier Payments' },
      ]}
    >
      <div className="erp-tabs">
        {[
          ['invoices', 'New invoice'],
          ['pay', 'Pay suppliers'],
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

      {tab === 'invoices' && (
        <SupplierInvoicesTab
          invoiceForm={invoiceForm}
          setInvoiceForm={setInvoiceForm}
          busy={busy}
          submitInvoice={submitInvoice}
          loading={loading}
          invoices={invoices}
        />
      )}

      {tab === 'pay' && (
        <SupplierPayTab
          loading={loading}
          groups={groups}
          openSupplier={openSupplier}
          selectedSupplier={selectedSupplier}
          invoicesInFlight={invoicesInFlight}
          selectedInvoiceIds={selectedInvoiceIds}
          toggleInvoice={toggleInvoice}
          busy={busy}
          preparePayment={preparePayment}
        />
      )}

      {/* Raised, not yet approved. Read-only — nothing is releasable until an
          approver decides. */}
      {tab === 'approval' && (
        <SupplierApprovalTab
          awaitingApproval={awaitingApproval}
          awaitingApprovalTotal={awaitingApprovalTotal}
        />
      )}

      {tab === 'release' && (
        <SupplierReleaseTab
          loading={loading}
          pending={pending}
          setReleaseTarget={setReleaseTarget}
        />
      )}

      {showOnAccountPopup && onAccount && (
        <SupplierOnAccountModal
          onAccount={onAccount}
          selectedVoucherIds={selectedVoucherIds}
          setSelectedVoucherIds={setSelectedVoucherIds}
          submitPayment={submitPayment}
          busy={busy}
        />
      )}

      {releaseTarget && (
        <SupplierReleaseModal
          releaseTarget={releaseTarget}
          releaseForm={releaseForm}
          setReleaseForm={setReleaseForm}
          setReleaseTarget={setReleaseTarget}
          busy={busy}
          releasePayment={releasePayment}
        />
      )}

      {supplierOptions.length > 0 && tab === 'invoices' && (
        <p className="erp-hint">
          Known suppliers from recent invoices: {supplierOptions.map((s) => s.name).join(', ')}
        </p>
      )}
    </PageShell>
  );
};

export default SupplierPaymentsPage;
