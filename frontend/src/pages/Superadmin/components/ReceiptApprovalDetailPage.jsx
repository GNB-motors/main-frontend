import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Receipt,
  CheckCircle2,
  XCircle,
  Archive,
  FileText,
  Gauge,
} from 'lucide-react';
import apiClient from '../../../utils/axiosConfig';
import './ReceiptApproval.css';

/* Detail + approval for a single WhatsApp fuel-bill draft.
   Publishes into the fuel ledger, or rejects / clears it from the inbox. */

const STATUS_BADGE = {
  READY: 'ra-badge--ready',
  PUBLISHED: 'ra-badge--published',
  REJECTED: 'ra-badge--rejected',
  CLEARED: 'ra-badge--cleared',
};

const fmtMoney = (n) =>
  n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const Field = ({ label, value, full }) => (
  <div className={`ra-field ${full ? 'ra-field--full' : ''}`}>
    <div className="ra-field__label">{label}</div>
    <div className="ra-field__value">{value || '—'}</div>
  </div>
);

/* Reason modal reused for reject + clear. */
const ReasonModal = ({ title, label, confirmLabel, confirmClass, busy, onCancel, onConfirm }) => {
  const [text, setText] = useState('');
  return (
    <div className="ra-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div className="ra-modal">
        <div className="ra-modal__head">{title}</div>
        <div className="ra-modal__body">
          <div className="ra-field__label" style={{ marginBottom: 8 }}>
            {label}
          </div>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Optional note…"
          />
        </div>
        <div className="ra-modal__foot">
          <button className="ra-btn ra-btn--ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className={`ra-btn ${confirmClass}`}
            onClick={() => onConfirm(text.trim())}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReceiptApprovalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperadminRoute = location.pathname.startsWith('/superadmin');
  const basePath = isSuperadminRoute ? '/superadmin/receipts' : '/whatsapp-approvals';

  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [modal, setModal] = useState(null); // 'reject' | 'clear' | null

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/api/whatsapp/admin/drafts/${id}`);
      setDraft(res.data?.data ?? null);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const publish = async () => {
    setActionBusy(true);
    setError('');
    try {
      await apiClient.post(`/api/whatsapp/admin/drafts/${id}/publish`);
      setBanner('Receipt published to the fuel ledger.');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Publish failed');
    } finally {
      setActionBusy(false);
    }
  };

  const doReasonAction = async (kind, note) => {
    setActionBusy(true);
    setError('');
    try {
      const body = kind === 'reject' ? { reason: note } : { note };
      await apiClient.post(`/api/whatsapp/admin/drafts/${id}/${kind}`, body);
      setBanner(kind === 'reject' ? 'Receipt rejected.' : 'Receipt cleared from the inbox.');
      setModal(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || `${kind} failed`);
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="ra-page">
        <div className="ra-state">
          <div className="ra-spinner" />
        </div>
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div className="ra-page">
        <button className="ra-back-link" onClick={() => navigate(basePath)}>
          <ArrowLeft size={16} /> Back to approvals
        </button>
        <div className="ra-alert ra-alert--error">{error}</div>
      </div>
    );
  }

  const veh = draft.vehicleId?.registrationNumber || draft.vehicleReg || '—';
  const submitter =
    [draft.userId?.firstName, draft.userId?.lastName].filter(Boolean).join(' ') ||
    draft.phoneE164 ||
    '—';
  const isReady = draft.status === 'READY';
  const ocr = draft.fuelOcr?.data || {};

  return (
    <div className="ra-page">
      <button className="ra-back-link" onClick={() => navigate(basePath)}>
        <ArrowLeft size={16} /> Back to approvals
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a2530', margin: '6px 0' }}>
          Fuel Receipt · {veh}
        </h1>
        <span className={`ra-badge ${STATUS_BADGE[draft.status] || 'ra-badge--cleared'}`}>
          <span className="ra-badge__dot" />
          {draft.status}
        </span>
      </div>

      {banner && <div className="ra-alert ra-alert--success">{banner}</div>}
      {error && <div className="ra-alert ra-alert--error">{error}</div>}

      <div className="ra-detail-grid">
        {/* ── Receipt image ── */}
        <div className="ra-panel">
          <div className="ra-panel__head">
            <Receipt size={16} /> Fuel Bill
          </div>
          <div className="ra-panel__body">
            {draft.fuelImageUrl ? (
              <>
                <div className="ra-image-wrap">
                  <img src={draft.fuelImageUrl} alt="Fuel bill" />
                </div>
                <div className="ra-image-sub">
                  <a href={draft.fuelImageUrl} target="_blank" rel="noreferrer">
                    Open full size
                  </a>
                </div>
              </>
            ) : (
              <div className="ra-image-empty">
                <FileText size={22} />
                <div>No image available</div>
              </div>
            )}

            {draft.odometerImageUrl && (
              <>
                <div className="ra-panel__head" style={{ border: 'none', paddingLeft: 0, marginTop: 16 }}>
                  <Gauge size={16} /> Odometer
                </div>
                <div className="ra-image-wrap">
                  <img src={draft.odometerImageUrl} alt="Odometer" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Extracted values + actions ── */}
        <div className="ra-panel">
          <div className="ra-panel__head">Extracted Details</div>
          <div className="ra-panel__body">
            <div className="ra-fields">
              <Field label="Vehicle" value={veh} />
              <Field
                label="Litres"
                value={draft.litres != null ? `${draft.litres} L` : '—'}
              />
              <Field label="Rate" value={draft.rate != null ? fmtMoney(draft.rate) : '—'} />
              <Field label="Amount" value={fmtMoney(draft.amount)} />
              <Field label="Fuel Type" value={draft.fuelType} />
              <Field label="Filling" value={draft.fillingType} />
              <Field
                label="Odometer"
                value={
                  draft.odometerReading != null
                    ? `${draft.odometerReading.toLocaleString('en-IN')} km${
                        draft.odometerSource ? ` (${draft.odometerSource})` : ''
                      }`
                    : '—'
                }
              />
              <Field label="Plate (OCR)" value={draft.plateText} />
              <Field label="Bill Date" value={fmtDateTime(draft.billDatetime)} />
              <Field
                label="OCR Confidence"
                value={ocr.confidence != null ? `${ocr.confidence}%` : '—'}
              />
              <Field label="Station" value={draft.stationName || ocr.location} full />
              <Field label="Submitted by" value={submitter} />
              <Field label="Organization" value={draft.orgId?.companyName} />
              <Field label="Received" value={fmtDateTime(draft.createdAt)} />
            </div>

            {isReady ? (
              <div className="ra-actions">
                <button className="ra-btn ra-btn--publish" onClick={publish} disabled={actionBusy}>
                  <CheckCircle2 size={18} />
                  {actionBusy ? 'Publishing…' : 'Publish to Fuel Ledger'}
                </button>
                <button
                  className="ra-btn ra-btn--reject"
                  onClick={() => setModal('reject')}
                  disabled={actionBusy}
                >
                  <XCircle size={18} /> Reject
                </button>
                <button
                  className="ra-btn ra-btn--clear"
                  onClick={() => setModal('clear')}
                  disabled={actionBusy}
                >
                  <Archive size={18} /> Clear
                </button>
              </div>
            ) : (
              <div className="ra-published-note">
                {draft.status === 'PUBLISHED' && (
                  <>
                    Published{draft.publishedAt ? ` on ${fmtDateTime(draft.publishedAt)}` : ''}
                    {draft.publishedBy
                      ? ` by ${[draft.publishedBy.firstName, draft.publishedBy.lastName]
                          .filter(Boolean)
                          .join(' ')}`
                      : ''}
                    {draft.publishedFuelLogId ? '. A fuel-log entry was created.' : '.'}
                  </>
                )}
                {draft.status === 'REJECTED' && (
                  <>Rejected{draft.rejectReason ? `: ${draft.rejectReason}` : '.'}</>
                )}
                {draft.status === 'CLEARED' && (
                  <>Cleared from the inbox{draft.clearNote ? `: ${draft.clearNote}` : '.'}</>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {modal === 'reject' && (
        <ReasonModal
          title="Reject receipt"
          label="Reason (shown in the audit trail)"
          confirmLabel="Reject"
          confirmClass="ra-btn--reject"
          busy={actionBusy}
          onCancel={() => setModal(null)}
          onConfirm={(note) => doReasonAction('reject', note)}
        />
      )}
      {modal === 'clear' && (
        <ReasonModal
          title="Clear receipt"
          label="Note (optional)"
          confirmLabel="Clear"
          confirmClass="ra-btn--clear"
          busy={actionBusy}
          onCancel={() => setModal(null)}
          onConfirm={(note) => doReasonAction('clear', note)}
        />
      )}
    </div>
  );
};

export default ReceiptApprovalDetailPage;
