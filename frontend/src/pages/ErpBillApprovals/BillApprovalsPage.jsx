import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
/**
 * Driver Bill Approvals (web)
 *
 * The web counterpart of the mobile "Approvals" queue. An owner/manager reviews
 * a bill a driver submitted (with its receipt photo) and confirms it — crediting
 * the driver's khata wallet — or rejects it with a reason. Same backend endpoints
 * as the app, so approvals stay in sync across web and app.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ReceiptText, Check, X, Info, AlertTriangle, RotateCw } from 'lucide-react';
import { toast } from 'react-toastify';
import BillApprovalsService from './BillApprovalsService';
import PageShell from '../../components/Erp/PageShell';
import { formatBillDate } from '../Mileage/billDates';
import '../../styles/erp.css';
import './BillApprovals.css';

const STATUS_TONE = { PENDING: 'warning', CONFIRMED: 'success', REJECTED: 'danger' };

// A bill without an amount shows a dash. It never shows ₹0 as if it were free.
const money = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
};
const hasAmount = (v) => money(v) !== '—';
const fmtDate = (d) => formatBillDate(d) || '—';
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
  const [error, setError] = useState('');

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
      setError('');
    } catch (err) {
      // The bills already on screen stay on screen; the message says what went wrong.
      if (err?.status === 404) {
        toast.error('The bill approvals feature is not enabled for your organization');
        setError('Driver bill approvals are not available for this organization.');
      } else {
        setError('Could not load driver bills. Try again.');
      }
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
        const driver = active.driver?.name || 'the driver';
        toast.success(
          hasAmount(active.amount)
            ? `Confirmed — ${money(active.amount)} credited to ${driver}'s wallet`
            : `Confirmed — the bill was credited to ${driver}'s wallet`,
        );
      } else {
        await BillApprovalsService.reject(active._id, remarks.trim());
        toast.success('Rejected — the driver can see the reason and re-submit');
      }
      closeReview();
      fetchBills(statusFilter, meta.page);
    } catch {
      toast.error('The bill could not be updated. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title="Driver expense bills" subtitle="Bills submitted by drivers from the app.">
      <div className="dba-page">
        <div className="erp-toolbar">
          <SearchableSelect
            className="erp-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REJECTED">Rejected</option>
            <option value="">All</option>
          </SearchableSelect>
          <Link className="dba-office-link" to="/approvals?type=office">
            Owner &amp; manager bill photos
          </Link>
        </div>

        <div className="erp-container">
          {error && (
            <div className="erp-state dba-error" role="alert">
              <AlertTriangle size={40} />
              <p>{error}</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fetchBills(statusFilter, meta.page)}
              >
                <RotateCw size={16} /> Retry
              </button>
            </div>
          )}
          {!error && loading && bills.length === 0 && (
            <div className="erp-state">
              <p>Loading bills...</p>
            </div>
          )}
          {!error && !loading && bills.length === 0 && (
            <div className="erp-state">
              <ReceiptText size={48} />
              <p>
                {statusFilter === 'PENDING'
                  ? 'No driver expense bills waiting.'
                  : 'No bills match this filter.'}
              </p>
            </div>
          )}
          {bills.length > 0 && (
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
        <div
          className="erp-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeReview();
          }}
        >
          <div className="erp-modal">
            <div className="erp-modal-header">
              <h2>
                {catLabel(active)} bill
                {hasAmount(active.amount) ? ` · ${money(active.amount)}` : ''}
              </h2>
              <button className="btn-icon" onClick={closeReview}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="erp-modal-body">
                {active.receiptUrl ? (
                  <div className="erp-field full" style={{ marginBottom: 16 }}>
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- captions the receipt link, not a form control; <label> only for the .erp-field label style */}
                    <label>Receipt</label>
                    <a href={active.receiptUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={active.receiptUrl}
                        alt="Bill receipt"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 320,
                          borderRadius: 8,
                          border: '1px solid var(--border, #e5e7eb)',
                        }}
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
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- captions the details table, not a form control; <label> only for the .erp-field label style */}
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
                      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- captions the Confirm/Reject button pair, which a <label> cannot label; kept for the .erp-field label style */}
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
                          <small>Credits the driver&apos;s wallet</small>
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
                        aria-label="Reason"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder={
                          decision === 'REJECTED'
                            ? 'Why is this rejected? (required)'
                            : 'Optional notes'
                        }
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
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- captions a read-only status badge, not a form control; <label> only for the .erp-field label style */}
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
                    {submitting
                      ? 'Saving...'
                      : decision === 'REJECTED'
                        ? 'Reject'
                        : hasAmount(active.amount)
                          ? `Confirm ${money(active.amount)}`
                          : 'Confirm the bill'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </PageShell>
  );
};

export default BillApprovalsPage;
