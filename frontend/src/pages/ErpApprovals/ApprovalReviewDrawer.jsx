import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowUpRight, Check, Info, Truck, X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import ErpDrawer from '../../components/Erp/ErpDrawer';
import ApprovalService from './ApprovalService';
import {
  APPROVAL_TYPE_LABELS,
  ENTITY_TYPE_LABELS,
  STATUS_TONE,
  formatReason,
} from './approval.constants';

const Row = ({ label, children }) => (
  <div className="erp-detail-row">
    <span className="erp-detail-label">{label}</span>
    <span className="erp-detail-value">{children}</span>
  </div>
);

const personName = (u) =>
  u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—' : '—';

const money = (n) =>
  (typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : null);

/**
 * One approval request, from why it fired to the decision.
 *
 * A slide-over rather than a modal, to match every other ERP review surface
 * (delivery order, advance, unloading): the queue stays visible behind it, so
 * an approver working through a backlog keeps their place.
 */
const ApprovalReviewDrawer = ({ approval, onClose, onDecided }) => {
  const [decision, setDecision] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setDecision('');
    setRemarks('');
  }, [approval]);

  if (!approval) return null;

  const pending = approval.status === 'PENDING';
  const entityName = ENTITY_TYPE_LABELS[approval.entityType] || approval.entityType;
  const ctx = approval.context || {};
  const hasContext = Boolean(ctx.trip || ctx.partyName || ctx.doNumber || ctx.amount != null);
  const reasonRows = formatReason(approval.reason);
  const snapshotRows = formatReason(approval.requestPayload);

  const valid = Boolean(
    decision && (decision !== 'REJECTED' || remarks.trim().length >= 3),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;

    setSubmitting(true);
    try {
      await ApprovalService.decide(approval._id, {
        status: decision,
        remarks: remarks.trim() || undefined,
      });
      toast.success(
        decision === 'APPROVED'
          ? 'Approved — the entity is released once all its requests clear'
          : 'Rejected — the entity has been cancelled',
      );
      onDecided();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ErpDrawer
      isOpen
      onClose={onClose}
      title={APPROVAL_TYPE_LABELS[approval.type] || approval.type}
      subtitle={`${entityName} · ${approval.entityLabel || '—'}`}
      maxWidth="560px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {pending ? 'Cancel' : 'Close'}
          </button>
          {pending && (
            <button
              type="submit"
              form="approval-decision-form"
              className={`btn ${decision === 'REJECTED' ? 'btn-danger' : 'btn-primary'}`}
              disabled={submitting || !decision}
            >
              {submitting ? 'Saving…' : decision === 'REJECTED' ? 'Reject' : 'Approve'}
            </button>
          )}
        </>
      }
    >
      {pending && (
        <div className="erp-callout info">
          <Info size={16} />
          <span>
            {entityName} <strong>{approval.entityLabel}</strong> is held until every request
            on it clears. Rejecting cancels it and closes any sibling requests.
          </span>
        </div>
      )}

      {hasContext && (
        <>
          <h3 className="erp-detail-heading">What you&apos;re approving</h3>
          <div className="erp-detail-block">
            {ctx.trip && (
              <Row label="Trip">
                <Link to={`/erp/trips/${ctx.trip.id}`} className="appr-trip-inline">
                  <Truck size={13} />
                  {ctx.trip.tripNumber}
                  {ctx.trip.route ? ` · ${ctx.trip.route}` : ''}
                  <ArrowUpRight size={12} />
                </Link>
              </Row>
            )}
            <Row label="Document">
              {entityName}
              {approval.entityLabel ? ` · ${approval.entityLabel}` : ''}
            </Row>
            {ctx.partyName && <Row label="Party">{ctx.partyName}</Row>}
            {ctx.vehicle && <Row label="Vehicle">{ctx.vehicle}</Row>}
            {ctx.doNumber && <Row label="DO">{ctx.doNumber}</Row>}
            {ctx.amount != null && <Row label="Amount">{money(ctx.amount)}</Row>}
          </div>
        </>
      )}

      <h3 className="erp-detail-heading">Why this was raised</h3>
      <div className="erp-detail-block">
        {reasonRows.length > 0 ? (
          reasonRows.map((r) => (
            <Row key={r.key} label={r.label}>
              {r.value}
            </Row>
          ))
        ) : (
          <Row label="Trigger">
            <span className="erp-cell-muted">No detail recorded</span>
          </Row>
        )}
        <Row label="Raised by">{personName(approval.requestedBy)}</Row>
      </div>

      {snapshotRows.length > 0 && (
        <>
          <h3 className="erp-detail-heading">Snapshot at request time</h3>
          <div className="erp-detail-block">
            {snapshotRows.map((r) => (
              <Row key={r.key} label={r.label}>
                {r.value}
              </Row>
            ))}
          </div>
        </>
      )}

      {pending ? (
        <form id="approval-decision-form" onSubmit={handleSubmit}>
          <h3 className="erp-detail-heading">
            Decision <span className="required">*</span>
          </h3>

          <div className="erp-outcomes">
            <button
              type="button"
              aria-pressed={decision === 'APPROVED'}
              className={`erp-outcome ${decision === 'APPROVED' ? 'selected' : ''}`}
              onClick={() => setDecision('APPROVED')}
            >
              <Check size={16} /> Approve
              <small>Releases once all requests clear</small>
            </button>
            <button
              type="button"
              aria-pressed={decision === 'REJECTED'}
              className={`erp-outcome ${decision === 'REJECTED' ? 'selected' : ''}`}
              onClick={() => setDecision('REJECTED')}
            >
              <X size={16} /> Reject
              <small>Cancels the entity</small>
            </button>
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
              placeholder={decision === 'REJECTED' ? 'Why? (required)' : 'Optional notes'}
            />
          </div>

          {decision === 'REJECTED' && (
            <div className="erp-callout danger" style={{ marginTop: 16 }}>
              <AlertTriangle size={16} />
              <span>This cancels {approval.entityLabel} and cannot be undone.</span>
            </div>
          )}
        </form>
      ) : (
        <>
          <h3 className="erp-detail-heading">Decision</h3>
          <div className="erp-detail-block">
            <Row label="Outcome">
              <span className={`erp-badge ${STATUS_TONE[approval.status] || 'neutral'}`}>
                {approval.status}
              </span>
            </Row>
            <Row label="Decided by">{personName(approval.decidedBy)}</Row>
            {approval.remarks && <Row label="Remarks">{approval.remarks}</Row>}
          </div>
        </>
      )}
    </ErpDrawer>
  );
};

export default ApprovalReviewDrawer;
