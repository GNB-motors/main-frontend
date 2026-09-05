/**
 * Approval Dashboard (ISOCL ERP)
 *
 * One queue for every "approval required" point in the pipeline. An entity can
 * raise more than one request — it is released only when the last one clears,
 * and a single rejection cancels it outright.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Check, X, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import ApprovalService from './ApprovalService';
import {
  APPROVAL_TYPE_LABELS,
  ENTITY_TYPE_LABELS,
  STATUS_TONE,
  ACTIVE_APPROVAL_TYPES,
  formatReason,
} from './approval.constants';
import '../../styles/erp.css';

const ApprovalsPage = () => {
  const [approvals, setApprovals] = useState([]);
  const [summary, setSummary] = useState({ total: 0, byType: [] });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [typeFilter, setTypeFilter] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const [active, setActive] = useState(null);
  const [decision, setDecision] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchApprovals = useCallback(async (status, type, page = 1) => {
    setLoading(true);
    try {
      const res = await ApprovalService.getApprovals({
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
        page,
        limit: 20,
      });
      setApprovals(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
    } catch (err) {
      if (err.status === 404) {
        toast.error('ERP is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await ApprovalService.getSummary();
      setSummary(res.data || { total: 0, byType: [] });
    } catch {
      setSummary({ total: 0, byType: [] });
    }
  }, []);

  useEffect(() => {
    fetchApprovals(statusFilter, typeFilter);
    fetchSummary();
  }, [fetchApprovals, fetchSummary, statusFilter, typeFilter]);

  const openDecision = (approval) => {
    setActive(approval);
    setDecision('');
    setRemarks('');
  };

  const closeDecision = () => {
    setActive(null);
    setDecision('');
    setRemarks('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!decision) {
      toast.error('Approve or reject?');
      return;
    }
    if (decision === 'REJECTED' && remarks.trim().length < 3) {
      toast.error('Remarks are required when rejecting');
      return;
    }

    setSubmitting(true);
    try {
      await ApprovalService.decide(active._id, {
        status: decision,
        remarks: remarks.trim() || undefined,
      });
      toast.success(
        decision === 'APPROVED'
          ? 'Approved — the entity is released once all its requests clear'
          : 'Rejected — the entity has been cancelled',
      );
      closeDecision();
      fetchApprovals(statusFilter, typeFilter, meta.page);
      fetchSummary();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const requesterName = (a) =>
    a.requestedBy
      ? `${a.requestedBy.firstName || ''} ${a.requestedBy.lastName || ''}`.trim() || '—'
      : '—';

  return (
    <div className="erp-page">
      <div className="erp-header">
        <div>
          <h1>Approvals</h1>
          <p className="erp-subtitle">
            {summary.total > 0
              ? `${summary.total} request${summary.total === 1 ? '' : 's'} waiting on a decision`
              : 'Nothing waiting on a decision'}
          </p>
        </div>
      </div>

      <div className="erp-toolbar">
        <select
          className="erp-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
        <select
          className="erp-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          {ACTIVE_APPROVAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {APPROVAL_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading approvals...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="erp-state">
            <ShieldCheck size={48} />
            <p>
              {statusFilter === 'PENDING'
                ? 'Nothing waiting for approval'
                : 'No approval requests match this filter'}
            </p>
          </div>
        ) : (
          <>
            <div className="erp-table-scroll">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Trigger</th>
                    <th>Why</th>
                    <th>Raised by</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((a) => (
                    <tr key={a._id}>
                      <td>
                        <div className="erp-cell-strong">{a.entityLabel || '—'}</div>
                        <div className="erp-cell-muted">
                          {ENTITY_TYPE_LABELS[a.entityType] || a.entityType}
                        </div>
                      </td>
                      <td>{APPROVAL_TYPE_LABELS[a.type] || a.type}</td>
                      <td className="erp-cell-muted">
                        {formatReason(a.reason)
                          .slice(0, 2)
                          .map((r) => `${r.label}: ${r.value}`)
                          .join(' · ') || '—'}
                      </td>
                      <td className="erp-cell-muted">{requesterName(a)}</td>
                      <td>
                        <span className={`erp-badge ${STATUS_TONE[a.status] || 'neutral'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td>
                        <div className="erp-actions">
                          {a.status === 'PENDING' ? (
                            <button className="btn btn-primary" onClick={() => openDecision(a)}>
                              Review
                            </button>
                          ) : (
                            <button className="btn btn-secondary" onClick={() => openDecision(a)}>
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
                  onClick={() => fetchApprovals(statusFilter, typeFilter, meta.page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {meta.page} of {meta.totalPages} · {meta.total} requests
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={meta.page === meta.totalPages}
                  onClick={() => fetchApprovals(statusFilter, typeFilter, meta.page + 1)}
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
          onClick={(e) => { if (e.target === e.currentTarget) closeDecision(); }}
        >
          <div className="erp-modal">
            <div className="erp-modal-header">
              <h2>{APPROVAL_TYPE_LABELS[active.type] || active.type}</h2>
              <button className="btn-icon" onClick={closeDecision}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="erp-modal-body">
                <div className="erp-callout info">
                  <Info size={16} />
                  <span>
                    {ENTITY_TYPE_LABELS[active.entityType] || active.entityType}{' '}
                    <strong>{active.entityLabel}</strong> is held until every request on it
                    clears. Rejecting cancels it and closes any sibling requests.
                  </span>
                </div>

                <div className="erp-field full" style={{ marginBottom: 16 }}>
                  <label>Why this was raised</label>
                  <table className="erp-table" style={{ minWidth: 0 }}>
                    <tbody>
                      {formatReason(active.reason).map((r) => (
                        <tr key={r.key}>
                          <td className="erp-cell-muted">{r.label}</td>
                          <td className="erp-cell-strong erp-numeric">{r.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {active.requestPayload && Object.keys(active.requestPayload).length > 0 && (
                  <div className="erp-field full" style={{ marginBottom: 16 }}>
                    <label>Snapshot at request time</label>
                    <table className="erp-table" style={{ minWidth: 0 }}>
                      <tbody>
                        {formatReason(active.requestPayload).map((r) => (
                          <tr key={r.key}>
                            <td className="erp-cell-muted">{r.label}</td>
                            <td>{r.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {active.status === 'PENDING' ? (
                  <>
                    <div className="erp-field full" style={{ marginBottom: 16 }}>
                      <label>
                        Decision <span className="required">*</span>
                      </label>
                      <div className="erp-outcomes">
                        <button
                          type="button"
                          className={`erp-outcome ${decision === 'APPROVED' ? 'selected' : ''}`}
                          onClick={() => setDecision('APPROVED')}
                        >
                          <Check size={16} /> Approve
                          <small>Releases once all requests clear</small>
                        </button>
                        <button
                          type="button"
                          className={`erp-outcome ${decision === 'REJECTED' ? 'selected' : ''}`}
                          onClick={() => setDecision('REJECTED')}
                        >
                          <X size={16} /> Reject
                          <small>Cancels the entity</small>
                        </button>
                      </div>
                    </div>

                    <div className="erp-field full">
                      <label htmlFor="approval-remarks">
                        Remarks
                        {decision === 'REJECTED' && <span className="required"> *</span>}
                      </label>
                      <textarea
                        id="approval-remarks"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder={
                          decision === 'REJECTED' ? 'Why? (required)' : 'Optional notes'
                        }
                      />
                    </div>

                    {decision === 'REJECTED' && (
                      <div className="erp-callout info" style={{ marginTop: 16 }}>
                        <AlertTriangle size={16} />
                        <span>This cancels {active.entityLabel} and cannot be undone.</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="erp-field full">
                    <label>Decision</label>
                    <p style={{ margin: 0 }}>
                      <span className={`erp-badge ${STATUS_TONE[active.status]}`}>
                        {active.status}
                      </span>
                      {active.remarks && (
                        <span className="erp-cell-muted"> — {active.remarks}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="erp-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeDecision}>
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
                        : 'Approve'}
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

export default ApprovalsPage;
