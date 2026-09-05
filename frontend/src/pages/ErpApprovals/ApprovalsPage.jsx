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
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Truck, ArrowUpRight, Clock, User,
} from 'lucide-react';
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

const money = (n) =>
  (typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : null);

/** Compact "raised 2h ago" so the queue conveys urgency without a full date. */
const relativeTime = (d) => {
  if (!d) return '—';
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return '—';
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

  const renderCard = (a) => {
    const ctx = a.context || {};
    const { trip } = ctx;
    const pending = a.status === 'PENDING';
    const why = formatReason(a.reason)
      .slice(0, 2)
      .map((r) => `${r.label}: ${r.value}`)
      .join(' · ');
    const entityText = `${ENTITY_TYPE_LABELS[a.entityType] || a.entityType}${a.entityLabel ? ` · ${a.entityLabel}` : ''}`;
    const chips = [
      trip ? entityText : null, // when no trip, entity is the sub-line below instead
      ctx.partyName,
      ctx.vehicle,
      ctx.doNumber ? `DO ${ctx.doNumber}` : null,
    ].filter(Boolean);

    return (
      <article key={a._id} className="appr-card">
        <div className="appr-card-body">
          <div className="appr-card-head">
            <span className="appr-type">{APPROVAL_TYPE_LABELS[a.type] || a.type}</span>
            <span className={`erp-badge ${STATUS_TONE[a.status] || 'neutral'}`}>{a.status}</span>
          </div>

          {trip ? (
            <Link to={`/erp/trips/${trip.id}`} className="appr-trip">
              <Truck size={14} />
              <span className="appr-trip-num">{trip.tripNumber}</span>
              {trip.route && <span className="appr-trip-route">{trip.route}</span>}
            </Link>
          ) : (
            <div className="appr-entity">{entityText}</div>
          )}

          {chips.length > 0 && (
            <div className="appr-chips">
              {chips.map((c) => (
                <span key={c} className="appr-chip">{c}</span>
              ))}
            </div>
          )}

          {why && <p className="appr-why">{why}</p>}

          <div className="appr-meta">
            <span><User size={12} /> {requesterName(a)}</span>
            <span><Clock size={12} /> {relativeTime(a.createdAt)}</span>
          </div>
        </div>

        <div className="appr-card-side">
          {ctx.amount != null && <div className="appr-amount">{money(ctx.amount)}</div>}
          <button
            type="button"
            className={`btn ${pending ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActive(a)}
          >
            {pending ? 'Review' : 'Details'}
          </button>
          {trip && (
            <Link to={`/erp/trips/${trip.id}`} className="appr-open-trip">
              Open trip
              <ArrowUpRight size={12} />
            </Link>
          )}
        </div>
      </article>
    );
  };

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
            {grouped.map((g) => (
              <section key={g.bucket.id} className="appr-group">
                <h2 className="appr-group-head">
                  {g.bucket.label}
                  <span className="erp-group-count">{g.rows.length}</span>
                </h2>
                <div className="appr-list">
                  {g.rows.map(renderCard)}
                </div>
              </section>
            ))}

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
