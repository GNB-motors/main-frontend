/**
 * Driver Bill Approvals (web)
 *
 * The web counterpart of the mobile "Approvals" queue. An owner/manager reviews
 * a bill a driver submitted (with its receipt photo) and confirms it — crediting
 * the driver's khata wallet — or rejects it with a reason. Same backend endpoints
 * as the app, so approvals stay in sync across web and app.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ReceiptText, Check, X, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import BillApprovalsService from './BillApprovalsService';
import '../../styles/erp.css';

const STATUS_TONE = { PENDING: 'warning', CONFIRMED: 'success', REJECTED: 'danger' };

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const catLabel = (b) => (b.title || b.category || 'Bill').replace(/ bill$/i, '');

const BillApprovalsPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const [active, setActive] = useState(null);
  const [decision, setDecision] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBills = useCallback(async (status, page = 1) => {
    setLoading(true);
    try {
      const res = await BillApprovalsService.list({
        ...(status ? { status } : {}),
        page,
        limit: 20,
      });
      setBills(res.results || []);
      setMeta({
        total: res.total || 0,
        page: res.page || 1,
        limit: res.limit || 20,
        totalPages: res.totalPages || 0,
      });
    } catch (err) {
      if (err.status === 404) toast.error('The bill approvals feature is not enabled for your organization');
      else toast.error(err.message);
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills(statusFilter);
  }, [fetchBills, statusFilter]);

  const openReview = (bill) => {
    setActive(bill);
    setDecision('');
    setRemarks('');
  };

  const closeReview = () => {
    setActive(null);
    setDecision('');
    setRemarks('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!decision) {
      toast.error('Confirm or reject?');
      return;
    }
    if (decision === 'REJECTED' && remarks.trim().length < 3) {
      toast.error('A reason is required when rejecting');
      return;
    }

    setSubmitting(true);
    try {
      if (decision === 'CONFIRMED') {
        await BillApprovalsService.confirm(active._id);
        toast.success(`Confirmed — ${money(active.amount)} credited to ${active.driver?.name || 'the driver'}'s wallet`);
      } else {
        await BillApprovalsService.reject(active._id, remarks.trim());
        toast.success('Rejected — the driver can see the reason and re-submit');
      }
      closeReview();
      fetchBills(statusFilter, meta.page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingText =
    statusFilter === 'PENDING' && meta.total > 0
      ? `${meta.total} bill${meta.total === 1 ? '' : 's'} waiting on a decision`
      : 'Driver bills submitted from the app';

  return (
    <div className="erp-page">
      <div className="erp-header">
        <div>
          <h1>Bill Approvals</h1>
          <p className="erp-subtitle">{pendingText}</p>
        </div>
      </div>

      <div className="erp-toolbar">
        <select
          className="erp-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading bills...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="erp-state">
            <ReceiptText size={48} />
            <p>
              {statusFilter === 'PENDING'
                ? 'No bills waiting for approval'
                : 'No bills match this filter'}
            </p>
          </div>
        ) : (
          <>
            <div className="erp-table-scroll">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Category</th>
                    <th className="erp-numeric">Amount</th>
                    <th>Bill date</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {bills.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <div className="erp-cell-strong">{b.driver?.name || '—'}</div>
                        <div className="erp-cell-muted">{b.driver?.mobileNumber || ''}</div>
                      </td>
                      <td>{catLabel(b)}</td>
                      <td className="erp-cell-strong erp-numeric">{money(b.amount)}</td>
                      <td className="erp-cell-muted">{fmtDate(b.expenseDate || b.createdAt)}</td>
                      <td>
                        <span className={`erp-badge ${STATUS_TONE[b.status] || 'neutral'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div className="erp-actions">
                          {b.status === 'PENDING' ? (
                            <button className="btn btn-primary" onClick={() => openReview(b)}>
                              Review
                            </button>
                          ) : (
                            <button className="btn btn-secondary" onClick={() => openReview(b)}>
                              Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 && (
              <div className="erp-pagination">
                <button
                  className="btn btn-secondary"
                  disabled={meta.page === 1}
                  onClick={() => fetchBills(statusFilter, meta.page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {meta.page} of {meta.totalPages} · {meta.total} bills
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={meta.page === meta.totalPages}
                  onClick={() => fetchBills(statusFilter, meta.page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {active && (
        <div className="erp-modal-backdrop" onClick={closeReview}>
          <div className="erp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h2>{catLabel(active)} bill · {money(active.amount)}</h2>
              <button className="btn-icon" onClick={closeReview}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="erp-modal-body">
                {active.receiptUrl ? (
                  <div className="erp-field full" style={{ marginBottom: 16 }}>
                    <label>Receipt</label>
                    <a href={active.receiptUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={active.receiptUrl}
                        alt="Bill receipt"
                        style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 8, border: '1px solid var(--border, #e5e7eb)' }}
                      />
                    </a>
                  </div>
                ) : (
                  <div className="erp-callout info" style={{ marginBottom: 16 }}>
                    <Info size={16} />
                    <span>No receipt photo was attached to this bill.</span>
                  </div>
                )}

                <div className="erp-field full" style={{ marginBottom: 16 }}>
                  <label>Details</label>
                  <table className="erp-table" style={{ minWidth: 0 }}>
                    <tbody>
                      <tr>
                        <td className="erp-cell-muted">Driver</td>
                        <td className="erp-cell-strong">{active.driver?.name || '—'}</td>
                      </tr>
                      {active.vehicle?.registrationNumber && (
                        <tr>
                          <td className="erp-cell-muted">Vehicle</td>
                          <td>{active.vehicle.registrationNumber}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="erp-cell-muted">Category</td>
                        <td>{catLabel(active)}</td>
                      </tr>
                      <tr>
                        <td className="erp-cell-muted">Bill date</td>
                        <td>{fmtDate(active.expenseDate || active.createdAt)}</td>
                      </tr>
                      <tr>
                        <td className="erp-cell-muted">Amount</td>
                        <td className="erp-cell-strong erp-numeric">{money(active.amount)}</td>
                      </tr>
                      {active.description && (
                        <tr>
                          <td className="erp-cell-muted">Note</td>
                          <td>{active.description}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {active.status === 'PENDING' ? (
                  <>
                    <div className="erp-field full" style={{ marginBottom: 16 }}>
                      <label>
                        Decision <span className="required">*</span>
                      </label>
                      <div className="erp-outcomes">
                        <button
                          type="button"
                          className={`erp-outcome ${decision === 'CONFIRMED' ? 'selected' : ''}`}
                          onClick={() => setDecision('CONFIRMED')}
                        >
                          <Check size={16} /> Confirm
                          <small>Credits the driver's wallet</small>
                        </button>
                        <button
                          type="button"
                          className={`erp-outcome ${decision === 'REJECTED' ? 'selected' : ''}`}
                          onClick={() => setDecision('REJECTED')}
                        >
                          <X size={16} /> Reject
                          <small>Sends it back with a reason</small>
                        </button>
                      </div>
                    </div>

                    <div className="erp-field full">
                      <label htmlFor="bill-remarks">
                        Reason
                        {decision === 'REJECTED' && <span className="required"> *</span>}
                      </label>
                      <textarea
                        id="bill-remarks"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder={decision === 'REJECTED' ? 'Why is this rejected? (required)' : 'Optional notes'}
                      />
                    </div>

                    {decision === 'REJECTED' && (
                      <div className="erp-callout info" style={{ marginTop: 16 }}>
                        <AlertTriangle size={16} />
                        <span>The driver sees this reason and can re-submit a corrected bill.</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="erp-field full">
                    <label>Decision</label>
                    <p style={{ margin: 0 }}>
                      <span className={`erp-badge ${STATUS_TONE[active.status] || 'neutral'}`}>
                        {active.status}
                      </span>
                      {active.rejectionReason && (
                        <span className="erp-cell-muted"> — {active.rejectionReason}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="erp-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeReview}>
                  Close
                </button>
                {active.status === 'PENDING' && (
                  <button
                    type="submit"
                    className={`btn ${decision === 'REJECTED' ? 'btn-danger' : 'btn-primary'}`}
                    disabled={submitting || !decision}
                  >
                    {submitting ? 'Saving...' : decision === 'REJECTED' ? 'Reject' : `Confirm ${money(active.amount)}`}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillApprovalsPage;
