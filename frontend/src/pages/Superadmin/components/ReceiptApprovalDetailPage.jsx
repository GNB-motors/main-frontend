import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Receipt,
  CheckCircle2,
  XCircle,
  Archive,
  Gauge,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Phone,
  Fuel,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import apiClient from '../../../utils/axiosConfig';
import ImagePreviewModal from '../../Trip/components/ImagePreviewModal';
import {
  fmtMoney,
  fmtLitres,
  fmtDate,
  fmtRelativeTime,
  evaluateOcrQuality,
  getOdometerMeta,
  crossVerifyStation,
} from './ReceiptApproval.shared';
import './ReceiptApproval.css';

const STATUS_BADGE = {
  READY: 'ra-badge--ready',
  PUBLISHED: 'ra-badge--published',
  REJECTED: 'ra-badge--rejected',
  CLEARED: 'ra-badge--cleared',
};

const Field = ({ label, value, full, highlight, mono }) => (
  <div
    className={`ra-field ${full ? 'ra-field--full' : ''} ${highlight ? 'ra-field--highlight' : ''}`}
  >
    <div className="ra-field__label">{label}</div>
    <div className={`ra-field__value ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
  </div>
);

const ReasonModal = ({ title, label, confirmLabel, confirmClass, busy, onCancel, onConfirm }) => {
  const [text, setText] = useState('');
  return (
    <div
      className="ra-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="ra-modal">
        <div className="ra-modal__head">{title}</div>
        <div className="ra-modal__body">
          <div className="ra-field__label" style={{ marginBottom: 8 }}>
            {label}
          </div>
          <textarea
            rows={3}
            className="ra-modal__textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="State your reason for audit logs and driver notification…"
            aria-label="Reason for audit log and driver notification"
          />
        </div>
        <div className="ra-modal__foot">
          <button type="button" className="ra-btn ra-btn--ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
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
  const [activeTab, setActiveTab] = useState('bill'); // 'bill' | 'odometer'
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const load = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const publish = async () => {
    setActionBusy(true);
    setError('');
    try {
      await apiClient.post(`/api/whatsapp/admin/drafts/${id}/publish`);
      setBanner('Receipt successfully published to the fleet fuel ledger.');
      toast.success('Receipt published to fuel ledger.');
      await load();
    } catch (e) {
      const msg = e.response?.data?.message || 'Publish failed';
      setError(msg);
      toast.error(msg);
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
      const msg = kind === 'reject' ? 'Receipt rejected.' : 'Receipt cleared from inbox.';
      setBanner(msg);
      toast.success(msg);
      setModal(null);
      await load();
    } catch (e) {
      const msg = e.response?.data?.message || `${kind} failed`;
      setError(msg);
      toast.error(msg);
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="ra-page">
        <div className="ra-state" style={{ minHeight: '400px' }}>
          <div className="ra-spinner" />
          <div className="ra-state__title" style={{ marginTop: 12 }}>
            Loading WhatsApp fuel receipt details…
          </div>
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

  const veh = draft?.vehicleId?.registrationNumber || draft?.vehicleReg || '—';
  const submitter =
    [draft?.userId?.firstName, draft?.userId?.lastName].filter(Boolean).join(' ') ||
    draft?.phoneE164 ||
    'Driver';
  const isReady = draft?.status === 'READY';
  const ocrEval = evaluateOcrQuality(draft);
  const odoMeta = getOdometerMeta(draft);
  const stationInfo = crossVerifyStation(draft);

  const currentImg = activeTab === 'odometer' ? draft?.odometerImageUrl : draft?.fuelImageUrl;

  return (
    <div className="ra-page">
      {/* Back button */}
      <button className="ra-back-link" onClick={() => navigate(basePath)}>
        <ArrowLeft size={16} /> Back to WhatsApp Approvals
      </button>

      {/* Header bar */}
      <div className="ra-detail-header">
        <div className="ra-detail-header__left">
          <div className="ra-detail-header__icon">
            <Fuel size={22} />
          </div>
          <div>
            <div className="ra-detail-header__title-row">
              <h1 className="ra-detail-header__title">Fuel Receipt · {veh}</h1>
              <span className={`ra-badge ${STATUS_BADGE[draft?.status] || 'ra-badge--cleared'}`}>
                <span className="ra-badge__dot" />
                {draft?.status}
              </span>
              <span className={`ra-ocr-tag ra-ocr-tag--${ocrEval.level}`}>
                <ShieldCheck size={13} />
                {ocrEval.score}% {ocrEval.label}
              </span>
            </div>
            <p className="ra-detail-header__subtitle">
              Submitted via WhatsApp by <strong>{submitter}</strong> on {fmtDate(draft?.createdAt)}{' '}
              ({fmtRelativeTime(draft?.createdAt)})
            </p>
          </div>
        </div>

        {/* Action Buttons in Header for fast access */}
        {isReady && (
          <div className="ra-detail-header__actions">
            <button
              type="button"
              className="ra-btn ra-btn--clear"
              onClick={() => setModal('clear')}
              disabled={actionBusy}
            >
              <Archive size={16} /> Clear
            </button>
            <button
              type="button"
              className="ra-btn ra-btn--reject"
              onClick={() => setModal('reject')}
              disabled={actionBusy}
            >
              <XCircle size={16} /> Reject
            </button>
            <button
              type="button"
              className="ra-btn ra-btn--publish"
              onClick={publish}
              disabled={actionBusy}
            >
              <CheckCircle2 size={16} />
              {actionBusy ? 'Publishing…' : 'Publish to Fuel Ledger'}
            </button>
          </div>
        )}
      </div>

      {banner && <div className="ra-alert ra-alert--success">{banner}</div>}
      {error && <div className="ra-alert ra-alert--error">{error}</div>}

      <div className="ra-detail-grid">
        {/* ── Left Column: Interactive Receipt & Odometer Image Stage ── */}
        <div className="ra-panel">
          <div className="ra-panel__head" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Receipt size={16} />
              <span>Inspection Stage</span>
            </div>

            <div className="ra-drawer__tab-strip" style={{ margin: 0 }}>
              <button
                type="button"
                className={`ra-drawer__tab ${activeTab === 'bill' ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab('bill');
                  setZoom(1);
                  setRotation(0);
                }}
              >
                Fuel Bill Slip
              </button>
              {draft?.odometerImageUrl && (
                <button
                  type="button"
                  className={`ra-drawer__tab ${activeTab === 'odometer' ? 'is-active' : ''}`}
                  onClick={() => {
                    setActiveTab('odometer');
                    setZoom(1);
                    setRotation(0);
                  }}
                >
                  Odometer Photo
                </button>
              )}
            </div>
          </div>

          <div className="ra-panel__body">
            <div className="ra-drawer__canvas" style={{ minHeight: '440px' }}>
              {currentImg ? (
                <img
                  src={currentImg}
                  alt="Bill inspection"
                  className="ra-drawer__img"
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                  draggable={false}
                />
              ) : (
                <div className="ra-image-empty">
                  <Receipt size={36} />
                  <div>No receipt image available for this draft</div>
                </div>
              )}
            </div>

            {/* Stage Controls */}
            {currentImg && (
              <div className="ra-drawer__img-tools" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="ra-drawer__zoom-pct">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 3.5))}
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
                <div className="ra-drawer__tool-divider" />
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate 90°"
                >
                  <RotateCw size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                  }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="ra-drawer__full-link"
                >
                  <Maximize2 size={13} /> Fullscreen Lightbox
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Extracted Values, Telematics & Verification ── */}
        <div className="ra-panel">
          <div className="ra-panel__head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCheck size={16} />
              <span>Extracted Details &amp; Telematics Cross-Verification</span>
            </div>
          </div>

          <div className="ra-panel__body">
            {/* Amount & Math Banner */}
            <div className="ra-amount-hero">
              <div className="ra-amount-hero__main">
                <span className="ra-amount-hero__label">Total Billed Value</span>
                <span className="ra-amount-hero__val font-mono">{fmtMoney(draft?.amount)}</span>
              </div>
              <div className="ra-amount-hero__sub">
                <span className="ra-pill-chip font-mono">
                  {fmtLitres(draft?.litres)} @ {fmtMoney(draft?.rate)}/L
                </span>
                {ocrEval.math?.isValid && (
                  <span className="ra-pill-chip ra-pill-chip--success">
                    <CheckCircle2 size={13} /> Math Verified ✓
                  </span>
                )}
                {ocrEval.math && !ocrEval.math.isValid && (
                  <span className="ra-pill-chip ra-pill-chip--warning">
                    <AlertTriangle size={13} /> Math Variance: ₹{Math.round(ocrEval.math.diff)}
                  </span>
                )}
              </div>
            </div>

            {/* Extracted Fields Grid */}
            <div className="ra-fields">
              <Field label="Vehicle Registration" value={veh} mono />
              <Field label="Volume (Litres)" value={fmtLitres(draft?.litres)} mono highlight />
              <Field label="Fuel Rate" value={fmtMoney(draft?.rate) + ' / L'} mono />
              <Field label="Total Amount" value={fmtMoney(draft?.amount)} mono highlight />
              <Field label="Fuel Type" value={draft?.fuelType || 'DIESEL'} />
              <Field label="Filling Type" value={draft?.fillingType || 'FULL_TANK'} />
              <Field
                label="Odometer Audit"
                value={`${odoMeta.displayReading} · ${odoMeta.badgeText}`}
                highlight={odoMeta.isMissing}
                mono
              />
              <Field label="Plate (OCR Detected)" value={draft?.plateText} mono />
              <Field label="Bill Timestamp" value={fmtDate(draft?.billDatetime)} />
              <Field label="AI Quality Health" value={`${ocrEval.score}% · ${ocrEval.label}`} />
            </div>

            {/* Triple-Check Telematics & Station Card */}
            <div className="ra-section-card" style={{ marginTop: 20 }}>
              <div className="ra-section-card__title">
                <MapPin size={15} /> Fuel Station &amp; Telematics Cross-Verification
              </div>
              <div className="ra-grid-props">
                <div className="ra-prop ra-prop--full">
                  <span className="ra-prop__label">Station Name / Location</span>
                  <span className="ra-prop__val font-mono">{stationInfo.stationName}</span>
                </div>
                <div className="ra-prop">
                  <span className="ra-prop__label">Station GPS Location</span>
                  <span className="ra-prop__val font-mono">{stationInfo.coordinates}</span>
                </div>
                <div className="ra-prop">
                  <span className="ra-prop__label">Vehicle Halt Duration</span>
                  <span className="ra-prop__val" style={{ color: 'var(--emerald-500, #10B981)' }}>
                    <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
                    {stationInfo.haltTime}
                  </span>
                </div>
                <div className="ra-prop">
                  <span className="ra-prop__label">Regional Benchmark Diesel Rate</span>
                  <span className="ra-prop__val">₹{stationInfo.benchmarkRate} / L</span>
                </div>
                <div className="ra-prop">
                  <span className="ra-prop__label">Rate Discrepancy</span>
                  <span
                    className="ra-prop__val"
                    style={{
                      color: stationInfo.isRateNormal
                        ? 'var(--emerald-500, #10B981)'
                        : 'var(--amber-500, #F59E0B)',
                    }}
                  >
                    {stationInfo.rateDiff != null
                      ? `${stationInfo.rateDiff > 0 ? '+' : ''}${stationInfo.rateDiff} ₹/L (${
                          stationInfo.isRateNormal ? 'Within normal range' : 'Rate anomaly'
                        })`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submitter & Audit History */}
            <div className="ra-section-card" style={{ marginTop: 16 }}>
              <div className="ra-section-card__title">
                <User size={15} /> Submitter &amp; Audit Trail
              </div>
              <div className="ra-grid-props">
                <div className="ra-prop">
                  <span className="ra-prop__label">Submitted by (Driver)</span>
                  <span className="ra-prop__val">{submitter}</span>
                </div>
                <div className="ra-prop">
                  <span className="ra-prop__label">WhatsApp Contact</span>
                  <span className="ra-prop__val font-mono">
                    <Phone size={11} style={{ marginRight: 3, display: 'inline' }} />
                    {draft?.phoneE164 || draft?.waId || '—'}
                  </span>
                </div>
                <div className="ra-prop">
                  <span className="ra-prop__label">Submission Received</span>
                  <span className="ra-prop__val">
                    {fmtDate(draft?.createdAt)} ({fmtRelativeTime(draft?.createdAt)})
                  </span>
                </div>
                <div className="ra-prop">
                  <span className="ra-prop__label">Organization</span>
                  <span className="ra-prop__val">{draft?.orgId?.companyName || '—'}</span>
                </div>
                {draft?.status === 'PUBLISHED' && (
                  <div className="ra-prop ra-prop--full">
                    <span className="ra-prop__label">Audit: Published by</span>
                    <span className="ra-prop__val" style={{ color: 'var(--emerald-500, #10B981)' }}>
                      {[draft?.publishedBy?.firstName, draft?.publishedBy?.lastName]
                        .filter(Boolean)
                        .join(' ') || 'Admin'}{' '}
                      on {fmtDate(draft?.publishedAt)}. Log ID:{' '}
                      {draft?.publishedFuelLogId || 'Created'}
                    </span>
                  </div>
                )}
                {draft?.status === 'REJECTED' && (
                  <div className="ra-prop ra-prop--full">
                    <span className="ra-prop__label">Audit: Rejection Reason</span>
                    <span className="ra-prop__val" style={{ color: 'var(--rose-500, #EF4444)' }}>
                      {draft?.rejectReason || 'No reason specified'}
                    </span>
                  </div>
                )}
                {draft?.status === 'CLEARED' && (
                  <div className="ra-prop ra-prop--full">
                    <span className="ra-prop__label">Audit: Cleared Note</span>
                    <span className="ra-prop__val">{draft?.clearNote || 'Cleared from inbox'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions for READY status */}
            {isReady && (
              <div className="ra-actions" style={{ marginTop: 24 }}>
                <button
                  type="button"
                  className="ra-btn ra-btn--publish"
                  onClick={publish}
                  disabled={actionBusy}
                >
                  <CheckCircle2 size={18} />
                  {actionBusy ? 'Publishing…' : 'Publish to Fuel Ledger'}
                </button>
                <button
                  type="button"
                  className="ra-btn ra-btn--reject"
                  onClick={() => setModal('reject')}
                  disabled={actionBusy}
                >
                  <XCircle size={18} /> Reject
                </button>
                <button
                  type="button"
                  className="ra-btn ra-btn--clear"
                  onClick={() => setModal('clear')}
                  disabled={actionBusy}
                >
                  <Archive size={18} /> Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {modal === 'reject' && (
        <ReasonModal
          title="Reject Fuel Receipt"
          label="State reason for audit trail & driver WhatsApp notification:"
          confirmLabel="Reject"
          confirmClass="ra-btn--reject"
          busy={actionBusy}
          onCancel={() => setModal(null)}
          onConfirm={(note) => doReasonAction('reject', note)}
        />
      )}

      {/* Clear Modal */}
      {modal === 'clear' && (
        <ReasonModal
          title="Clear Receipt from Inbox"
          label="Optional internal note:"
          confirmLabel="Clear"
          confirmClass="ra-btn--clear"
          busy={actionBusy}
          onCancel={() => setModal(null)}
          onConfirm={(note) => doReasonAction('clear', note)}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && currentImg && (
        <ImagePreviewModal
          imageSrc={currentImg}
          title={`Full Slip Inspection · ${veh}`}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};

export default ReceiptApprovalDetailPage;
