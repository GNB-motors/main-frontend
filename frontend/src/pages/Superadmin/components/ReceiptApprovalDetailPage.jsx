import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Archive,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  Fuel,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import { ReceiptApprovalService } from './ReceiptApprovalService';
import Field from './receipts/Field';
import ReasonModal from './receipts/ReasonModal';
import DetailInspectionPanel from './receipts/DetailInspectionPanel';
import DetailStationCard from './receipts/DetailStationCard';
import DetailAuditCard from './receipts/DetailAuditCard';
import ImagePreviewModal from '../../Trip/components/ImagePreviewModal';
import { fmtMoney, fmtLitres, fmtDate, fmtRelativeTime } from './receipts/receiptFormat';
import {
  evaluateOcrQuality,
  getOdometerMeta,
  crossVerifyStation,
} from './receipts/receiptVerification';
import './ReceiptApproval.css';

const STATUS_BADGE = {
  READY: 'ra-badge--ready',
  PUBLISHED: 'ra-badge--published',
  REJECTED: 'ra-badge--rejected',
  CLEARED: 'ra-badge--cleared',
};

const ReceiptApprovalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperadminRoute = location.pathname.startsWith('/superadmin');
  const basePath = isSuperadminRoute ? '/superadmin/receipts' : '/approvals?type=whatsapp';

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
      setDraft(await ReceiptApprovalService.getDraft(id));
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
      await ReceiptApprovalService.publishDraft(id);
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
      if (kind === 'reject') await ReceiptApprovalService.rejectDraft(id, note);
      else await ReceiptApprovalService.clearDraft(id, note);
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
        <ArrowLeft size={16} />{' '}
        {isSuperadminRoute ? 'Back to WhatsApp Approvals' : 'Back to Approvals'}
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
        <DetailInspectionPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setZoom={setZoom}
          setRotation={setRotation}
          draft={draft}
          currentImg={currentImg}
          zoom={zoom}
          rotation={rotation}
          setLightboxOpen={setLightboxOpen}
        />

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
            <DetailStationCard stationInfo={stationInfo} />

            {/* Submitter & Audit History */}
            <DetailAuditCard submitter={submitter} draft={draft} />

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
