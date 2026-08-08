/**
 * Sale Bill Making (ISOCL ERP Stage 9)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, X, Printer, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import SaleBillApi from './SaleBillService';
import '../../styles/erp.css';

const money = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

const todayInput = () => new Date().toISOString().slice(0, 10);

const SaleBillsPage = () => {
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
    <div className="erp-page">
      <header className="erp-page-header">
        <div>
          <h1>
            <Receipt size={22} /> Sale Bills
          </h1>
          <p>Create bills, submit to party, record received date for due date.</p>
        </div>
      </header>

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
        <div>
          {submissionGroups.length === 0 ? (
            <p className="erp-muted">No approved bills awaiting submission.</p>
          ) : (
            submissionGroups.map((g) => (
              <div key={g.partyId} className="erp-callout" style={{ marginBottom: 16 }}>
                <h3>
                  {g.partyName} <span className="erp-muted">({g.partyCode})</span>
                </h3>
                {g.notSent?.length > 0 && (
                  <>
                    <h4>Not sent yet</h4>
                    <div className="erp-table-wrap">
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th>Bill #</th>
                            <th>Date</th>
                            <th>Net</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {g.notSent.map((b) => (
                            <tr key={b.billId}>
                              <td>{b.billNumber}</td>
                              <td>{b.billDate ? new Date(b.billDate).toLocaleDateString('en-IN') : '—'}</td>
                              <td>{money(b.netAmount)}</td>
                              <td>
                                <button type="button" className="erp-btn erp-btn-primary" onClick={() => openSubmit(b)}>
                                  Submit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                {g.waitingAcknowledgement?.length > 0 && (
                  <>
                    <h4>Sent — waiting for party acknowledgement</h4>
                    <div className="erp-table-wrap">
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th>Bill #</th>
                            <th>Submitted</th>
                            <th>Ageing</th>
                            <th>Courier</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {g.waitingAcknowledgement.map((b) => (
                            <tr key={b.billId}>
                              <td>{b.billNumber}</td>
                              <td>{b.submittedDate ? new Date(b.submittedDate).toLocaleDateString('en-IN') : '—'}</td>
                              <td>{b.ageingDays ?? 0} days</td>
                              <td>{b.courierDocket || b.deliveryMode || '—'}</td>
                              <td>
                                <button type="button" className="erp-btn erp-btn-primary" onClick={() => openReceive(b)}>
                                  Mark received
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      ) : tab === 'pending' ? (
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Party</th>
                <th>Pending trips</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pendingGroups.length === 0 ? (
                <tr>
                  <td colSpan={3} className="erp-muted">
                    No unbilled unloadings.
                  </td>
                </tr>
              ) : (
                pendingGroups.map((g) => (
                  <tr key={g.partyId}>
                    <td>
                      {g.partyName}{' '}
                      <span className="erp-muted">({g.partyCode})</span>
                    </td>
                    <td>{g.unloadings.length}</td>
                    <td>
                      <button
                        type="button"
                        className="erp-btn erp-btn-primary"
                        onClick={() => openParty(g)}
                      >
                        Create bill
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Party</th>
                <th>Date</th>
                <th>Lines</th>
                <th>Net</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="erp-muted">
                    No sale bills yet.
                  </td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr key={b._id}>
                    <td>{b.billNumber}</td>
                    <td>{b.partyId?.name || '—'}</td>
                    <td>{b.billDate ? new Date(b.billDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td>{b.lines?.length ?? '—'}</td>
                    <td>{money(b.netAmount)}</td>
                    <td>{b.status}</td>
                    <td>
                      <button type="button" className="erp-btn" onClick={() => openDetail(b._id)}>
                        View
                      </button>
                      {['APPROVED', 'SUBMITTED', 'PARTIALLY_PAID', 'PAID'].includes(b.status) && (
                        <button
                          type="button"
                          className="erp-btn erp-btn-primary"
                          style={{ marginLeft: 8 }}
                          onClick={() => handlePrint(b._id)}
                          disabled={busy}
                        >
                          <Printer size={14} /> Print
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedParty && (
        <div className="erp-modal-backdrop">
          <div className="erp-modal" style={{ maxWidth: 640 }}>
            <div className="erp-modal-header">
              <h2>Bill — {selectedParty.partyName}</h2>
              <button type="button" className="erp-icon-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createBill} className="erp-form">
              <label>
                Bill date
                <input
                  type="date"
                  required
                  max={todayInput()}
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                />
              </label>
              <div className="erp-table-wrap">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th />
                      <th>CN</th>
                      <th>Trip</th>
                      <th>Qty</th>
                      <th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedParty.unloadings.map((u) => (
                      <tr key={u.unloadingId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(u.unloadingId)}
                            onChange={() => toggleRow(u.unloadingId)}
                          />
                        </td>
                        <td>{u.cnNumber}</td>
                        <td>{u.tripNumber}</td>
                        <td>
                          {u.unloadedQty} {u.qtyUnit}
                        </td>
                        <td>{money(u.netReceivable)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                <strong>Selected total: {money(selectedTotal)}</strong>
              </p>
              <div className="erp-modal-actions">
                <button type="submit" className="erp-btn erp-btn-primary" disabled={busy}>
                  {busy ? 'Creating…' : 'Create bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {submitTarget && (
        <div className="erp-modal-backdrop">
          <div className="erp-modal" style={{ maxWidth: 480 }}>
            <div className="erp-modal-header">
              <h2>Submit {submitTarget.billNumber}</h2>
              <button type="button" className="erp-icon-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="erp-form">
              <label>
                Submit date
                <input
                  type="date"
                  required
                  max={todayInput()}
                  value={submitForm.submittedDate}
                  onChange={(e) => setSubmitForm((f) => ({ ...f, submittedDate: e.target.value }))}
                />
              </label>
              <label>
                Delivery mode
                <select
                  value={submitForm.deliveryMode}
                  onChange={(e) => setSubmitForm((f) => ({ ...f, deliveryMode: e.target.value }))}
                >
                  <option value="COURIER">Courier</option>
                  <option value="BY_HAND">By hand</option>
                  <option value="EMAIL">Email</option>
                </select>
              </label>
              {submitForm.deliveryMode === 'COURIER' && (
                <>
                  <label>
                    Courier name
                    <input
                      type="text"
                      required
                      value={submitForm.courierName}
                      onChange={(e) => setSubmitForm((f) => ({ ...f, courierName: e.target.value }))}
                    />
                  </label>
                  <label>
                    Docket #
                    <input
                      type="text"
                      required
                      value={submitForm.courierDocket}
                      onChange={(e) => setSubmitForm((f) => ({ ...f, courierDocket: e.target.value }))}
                    />
                  </label>
                </>
              )}
              {submitForm.deliveryMode === 'BY_HAND' && (
                <label>
                  Handed to
                  <input
                    type="text"
                    required
                    value={submitForm.handDeliveredTo}
                    onChange={(e) => setSubmitForm((f) => ({ ...f, handDeliveredTo: e.target.value }))}
                  />
                </label>
              )}
              <div className="erp-modal-actions">
                <button type="submit" className="erp-btn erp-btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Record submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {receiveTarget && (
        <div className="erp-modal-backdrop">
          <div className="erp-modal" style={{ maxWidth: 420 }}>
            <div className="erp-modal-header">
              <h2>Party received — {receiveTarget.billNumber}</h2>
              <button type="button" className="erp-icon-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReceived} className="erp-form">
              <p className="erp-muted">
                Due date will be computed from this date + party credit days.
              </p>
              <label>
                Party received date
                <input
                  type="date"
                  required
                  max={todayInput()}
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                />
              </label>
              <div className="erp-modal-actions">
                <button type="submit" className="erp-btn erp-btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Mark received'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail && (
        <div className="erp-modal-backdrop">
          <div className="erp-modal" style={{ maxWidth: 720 }}>
            <div className="erp-modal-header">
              <h2>{detail.billNumber}</h2>
              <button type="button" className="erp-icon-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <div className="erp-form">
              <p>
                Party: {detail.partyId?.name} · Status: {detail.status} · Net:{' '}
                {money(detail.netAmount)}
              </p>
              <div className="erp-table-wrap">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>CN</th>
                      <th>Vehicle</th>
                      <th>Route</th>
                      <th>Net</th>
                      <th>Bilty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.lines || []).map((line) => (
                      <tr key={line.cnId || line.unloadingId}>
                        <td>{line.cnNumber}</td>
                        <td>{line.vehicleNumber}</td>
                        <td>
                          {line.fromLocation} → {line.toLocation}
                        </td>
                        <td>{money(line.lineNet)}</td>
                        <td>
                          {line.biltyUrl ? (
                            <a href={line.biltyUrl} target="_blank" rel="noreferrer">
                              <ExternalLink size={14} /> View
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {['APPROVED', 'SUBMITTED', 'PARTIALLY_PAID', 'PAID'].includes(detail.status) && (
                <button
                  type="button"
                  className="erp-btn erp-btn-primary"
                  onClick={() => handlePrint(detail._id)}
                  disabled={busy}
                >
                  <Printer size={14} /> Print
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleBillsPage;
