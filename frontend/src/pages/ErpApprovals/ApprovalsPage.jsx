/**
 * Approval Dashboard (ISOCL ERP)
 *
 * One queue for every "approval required" point in the pipeline. An entity can
 * raise more than one request — it is released only when the last one clears,
 * and a single rejection cancels it outright.
 */

import React, {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import ApprovalService from './ApprovalService';
import ApprovalReviewDrawer from './ApprovalReviewDrawer';
import {
  APPROVAL_TYPE_LABELS,
  ENTITY_TYPE_LABELS,
  STATUS_TONE,
  ACTIVE_APPROVAL_TYPES,
  APPROVAL_BUCKETS,
  bucketForType,
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

  const handleDecided = useCallback(() => {
    fetchApprovals(statusFilter, typeFilter, meta.page);
    fetchSummary();
  }, [fetchApprovals, fetchSummary, statusFilter, typeFilter, meta.page]);

  const requesterName = (a) =>
    a.requestedBy
      ? `${a.requestedBy.firstName || ''} ${a.requestedBy.lastName || ''}`.trim() || '—'
      : '—';

  // Pending counts per family, from the summary the page already fetches.
  const bucketCounts = useMemo(() => {
    const counts = {
      PLACEMENT: 0, BILLING: 0, PURCHASE: 0, PAYMENTS: 0,
    };
    (summary.byType || []).forEach((row) => {
      const type = row._id || row.type;
      counts[bucketForType(type)] += row.count || 0;
    });
    return counts;
  }, [summary]);

  // The current page's rows, split into the four families (order preserved).
  const grouped = useMemo(
    () => APPROVAL_BUCKETS
      .map((b) => ({ bucket: b, rows: approvals.filter((a) => bucketForType(a.type) === b.id) }))
      .filter((g) => g.rows.length),
    [approvals],
  );

  const renderRow = (a) => (
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
            <button className="btn btn-primary" onClick={() => setActive(a)}>
              Review
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={() => setActive(a)}>
              Details
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="erp-page">
      <div className="erp-header">
        <div>
          <h1>Approval Center</h1>
          <p className="erp-subtitle">
            {summary.total > 0
              ? `${summary.total} request${summary.total === 1 ? '' : 's'} waiting on a decision`
              : 'Nothing waiting on a decision'}
          </p>
        </div>
      </div>

      {/* Where the pending work sits, by family. */}
      <div className="erp-buckets">
        {APPROVAL_BUCKETS.map((b) => (
          <div key={b.id} className="erp-bucket">
            <span className="erp-bucket-count">{bucketCounts[b.id]}</span>
            <span className="erp-bucket-label">{b.label}</span>
          </div>
        ))}
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
          {APPROVAL_BUCKETS.map((b) => (
            <optgroup key={b.id} label={b.label}>
              {b.types.map((t) => (
                <option key={t} value={t}>
                  {APPROVAL_TYPE_LABELS[t] || t}
                  {ACTIVE_APPROVAL_TYPES.includes(t) ? '' : ' · soon'}
                </option>
              ))}
            </optgroup>
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
                  {grouped.map((g) => (
                    <React.Fragment key={g.bucket.id}>
                      <tr className="erp-group-row">
                        <td colSpan={6}>
                          {g.bucket.label}
                          <span className="erp-group-count">{g.rows.length}</span>
                        </td>
                      </tr>
                      {g.rows.map(renderRow)}
                    </React.Fragment>
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

      <ApprovalReviewDrawer
        approval={active}
        onClose={() => setActive(null)}
        onDecided={handleDecided}
      />
    </div>
  );
};

export default ApprovalsPage;
