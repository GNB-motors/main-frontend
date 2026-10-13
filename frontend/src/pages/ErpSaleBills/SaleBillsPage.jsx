/**
 * Sale Bill Making (ISOCL ERP Stage 9)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Receipt } from 'lucide-react';
import { toast } from 'react-toastify';
import SaleBillApi from './SaleBillService';
import PageShell from '../../components/Erp/PageShell';
import { todayInput } from './todayInput';
import SubmissionTab from './sections/SubmissionTab';
import PendingBillingTable from './sections/PendingBillingTable';
import SaleBillsTable from './sections/SaleBillsTable';
import CreateBillModal from './sections/CreateBillModal';
import SubmitBillModal from './sections/SubmitBillModal';
import ReceiveBillModal from './sections/ReceiveBillModal';
import SaleBillDetailModal from './sections/SaleBillDetailModal';
import '../../styles/erp.css';

const SaleBillsPage = ({ embedded = false }) => {
  const [tab, setTab] = useState('pending');
  const [pendingGroups, setPendingGroups] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [selectedParty, setSelectedParty] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [billDate, setBillDate] = useState(todayInput());

  const [detail, setDetail] = useState(null);

  const [submissionGroups, setSubmissionGroups] = useState([]);
  const [submitTarget, setSubmitTarget] = useState(null);
  const [receiveTarget, setReceiveTarget] = useState(null);
  const [submitForm, setSubmitForm] = useState({
    submittedDate: todayInput(),
    deliveryMode: 'COURIER',
    courierName: '',
    courierDocket: '',
    handDeliveredTo: '',
  });
  const [receivedDate, setReceivedDate] = useState(todayInput());

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SaleBillApi.getPending({ limit: 50 });
      setPendingGroups(res.data || []);
    } catch (err) {
      if (err.status === 404) {
        toast.error('Sale billing is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setPendingGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SaleBillApi.list({ limit: 50 });
      setBills(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubmission = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SaleBillApi.getPendingSubmission({ limit: 50 });
      setSubmissionGroups(res.data || []);
    } catch (err) {
      toast.error(err.message);
      setSubmissionGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'pending') fetchPending();
    else if (tab === 'submitting') fetchSubmission();
    else fetchBills();
  }, [tab, fetchPending, fetchSubmission, fetchBills]);

  const openParty = (group) => {
    setSelectedParty(group);
    setSelectedIds(new Set());
    setBillDate(todayInput());
  };

  const closeModal = () => {
    setSelectedParty(null);
    setDetail(null);
    setSubmitTarget(null);
    setReceiveTarget(null);
  };

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createBill = async (e) => {
    e.preventDefault();
    if (!selectedParty || selectedIds.size === 0) {
      toast.error('Select at least one trip');
      return;
    }
    setBusy(true);
    try {
      await SaleBillApi.create({
        partyId: selectedParty.partyId,
        billDate,
        unloadingIds: [...selectedIds],
      });
      toast.success('Sale bill created — pending approval');
      closeModal();
      fetchPending();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openDetail = async (billId) => {
    setBusy(true);
    try {
      const res = await SaleBillApi.getById(billId);
      setDetail(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = async (billId) => {
    setBusy(true);
    try {
      const res = await SaleBillApi.print(billId);
      toast.success(`Print unlocked for ${res.data.billNumber}`);
      if (detail?._id === billId) setDetail(res.data);
      fetchBills();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitTarget) return;
    setBusy(true);
    try {
      await SaleBillApi.submit(submitTarget.billId, submitForm);
      toast.success('Bill submission recorded');
      closeModal();
      fetchSubmission();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReceived = async (e) => {
    e.preventDefault();
    if (!receiveTarget) return;
    setBusy(true);
    try {
      await SaleBillApi.markReceived(receiveTarget.billId, {
        partyReceivedDate: receivedDate,
      });
      toast.success('Party receipt recorded — bill is now outstanding');
      closeModal();
      fetchSubmission();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openSubmit = (bill) => {
    setSubmitTarget(bill);
    setSubmitForm({
      submittedDate: todayInput(),
      deliveryMode: 'COURIER',
      courierName: '',
      courierDocket: '',
      handDeliveredTo: '',
    });
  };

  const openReceive = (bill) => {
    setReceiveTarget(bill);
    setReceivedDate(todayInput());
  };

  const selectedTotal = selectedParty
    ? selectedParty.unloadings
        .filter((u) => selectedIds.has(u.unloadingId))
        .reduce((s, u) => s + (u.netReceivable || 0), 0)
    : 0;

  return (
    <PageShell
      embedded={embedded}
      title={
        <>
          <Receipt size={22} /> Sale Bills
        </>
      }
      subtitle="Create bills, submit to party, record received date for due date."
      breadcrumbs={[
        { label: 'ERP', to: '/erp' },
        { label: 'Billing', to: '/erp/billing' },
        { label: 'Sale Bills' },
      ]}
    >
      <div className="erp-tabs">
        {[
          ['pending', 'Pending Billing'],
          ['submitting', 'Bill Submitting'],
          ['bills', 'Sale Bills'],
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

      {loading ? (
        <p className="erp-muted">Loading…</p>
      ) : tab === 'submitting' ? (
        <SubmissionTab
          submissionGroups={submissionGroups}
          openSubmit={openSubmit}
          openReceive={openReceive}
        />
      ) : tab === 'pending' ? (
        <PendingBillingTable pendingGroups={pendingGroups} openParty={openParty} />
      ) : (
        <SaleBillsTable
          bills={bills}
          openDetail={openDetail}
          handlePrint={handlePrint}
          busy={busy}
        />
      )}

      {selectedParty && (
        <CreateBillModal
          selectedParty={selectedParty}
          closeModal={closeModal}
          createBill={createBill}
          billDate={billDate}
          setBillDate={setBillDate}
          selectedIds={selectedIds}
          toggleRow={toggleRow}
          selectedTotal={selectedTotal}
          busy={busy}
        />
      )}

      {submitTarget && (
        <SubmitBillModal
          submitTarget={submitTarget}
          closeModal={closeModal}
          handleSubmit={handleSubmit}
          submitForm={submitForm}
          setSubmitForm={setSubmitForm}
          busy={busy}
        />
      )}

      {receiveTarget && (
        <ReceiveBillModal
          receiveTarget={receiveTarget}
          closeModal={closeModal}
          handleReceived={handleReceived}
          receivedDate={receivedDate}
          setReceivedDate={setReceivedDate}
          busy={busy}
        />
      )}

      {detail && (
        <SaleBillDetailModal
          detail={detail}
          closeModal={closeModal}
          handlePrint={handlePrint}
          busy={busy}
        />
      )}
    </PageShell>
  );
};

export default SaleBillsPage;
