import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Maximize2,
  CheckCircle2,
  XCircle,
  Archive,
  Receipt,
  Gauge,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import apiClient from '../../../utils/axiosConfig';
import { toast } from 'react-toastify';
import {
  fmtMoney,
  fmtLitres,
  fmtDate,
  fmtRelativeTime,
  evaluateOcrQuality,
  getOdometerMeta,
  crossVerifyStation,
} from './ReceiptApproval.shared';

const STATUS_BADGE = {
  READY: 'ra-badge--ready',
  PUBLISHED: 'ra-badge--published',
  REJECTED: 'ra-badge--rejected',
  CLEARED: 'ra-badge--cleared',
};

const ReceiptApprovalDrawer = ({
  draftId,
  isOpen,
  onClose,
  onUpdated,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  basePath,
  navigate,
}) => {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState('bill'); // 'bill' | 'odometer'
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch complete draft details with presigned URLs
  const loadDraft = useCallback(async () => {
    if (!draftId) return;
    setLoading(true);
    setZoom(1);
    setRotation(0);
    try {
      const res = await apiClient.get(`/api/whatsapp/admin/drafts/${draftId}`);
      setDraft(res.data?.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load receipt details');
    } finally {
      setLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    if (isOpen && draftId) {
      loadDraft();
    }
  }, [isOpen, draftId, loadDraft]);

  // Handle escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !rejectModalOpen) onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
      if (e.key === 'ArrowRight' && hasNext) onNext?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, onPrev, onNext, hasPrev, hasNext, rejectModalOpen]);

  // Publish action
  const handlePublish = async () => {
    if (!draft?._id || actionBusy) return;
    setActionBusy(true);
    try {
      await apiClient.post(`/api/whatsapp/admin/drafts/${draft._id}/publish`);
      toast.success(`Published receipt for ${draft.vehicleReg || 'vehicle'} to Fuel Ledger`);
      await loadDraft();
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish failed');
    } finally {
      setActionBusy(false);
    }
  };

  // Reject action
  const handleReject = async () => {
    if (!draft?._id || actionBusy) return;
    setActionBusy(true);
    try {
      await apiClient.post(`/api/whatsapp/admin/drafts/${draft._id}/reject`, {
        reason: rejectReason.trim() || undefined,
      });
      toast.success('Receipt marked as rejected');
      setRejectModalOpen(false);
      setRejectReason('');
      await loadDraft();
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
    } finally {
      setActionBusy(false);
    }
  };

  // Clear action
  const handleClear = async () => {
    if (!draft?._id || actionBusy) return;
    setActionBusy(true);
    try {
      await apiClient.post(`/api/whatsapp/admin/drafts/${draft._id}/clear`, {
        note: 'Cleared from drawer',
      });
      toast.success('Receipt cleared from inbox');
      await loadDraft();
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Clear failed');
    } finally {
      setActionBusy(false);
    }
  };

  if (!isOpen) return null;

  const veh = draft?.vehicleId?.registrationNumber || draft?.vehicleReg || '—';
  const submitter =
    [draft?.userId?.firstName, draft?.userId?.lastName].filter(Boolean).join(' ') ||
    draft?.phoneE164 ||
    'Driver';
  const ocrEval = evaluateOcrQuality(draft);
  const odoMeta = getOdometerMeta(draft);
  const stationInfo = crossVerifyStation(draft);
  const isReady = draft?.status === 'READY';

  const currentImg = activeTab === 'odometer' ? draft?.odometerImageUrl : draft?.fuelImageUrl;

  return (
    <div className="ra-drawer-backdrop" onClick={onClose}>
      <div className="ra-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="ra-drawer__header">
          <div className="ra-drawer__header-left">
            <span className="ra-drawer__veh-badge">
              <Receipt size={16} />
              {veh}
            </span>
            {draft && (
              <span className={`ra-badge ${STATUS_BADGE[draft.status] || 'ra-badge--cleared'}`}>
                <span className="ra-badge__dot" />
                {draft.status}
              </span>
            )}
            {draft && (
              <span className={`ra-ocr-tag ra-ocr-tag--${ocrEval.level}`}>
                <ShieldCheck size={13} />
                {ocrEval.score}% {ocrEval.label}
              </span>
            )}
          </div>

          <div className="ra-drawer__header-right">
            {hasPrev && (
              <button
                type="button"
                className="ra-drawer__nav-btn"
                onClick={onPrev}
                title="Previous Receipt (←)"
                aria-label="Previous Receipt"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {hasNext && (
              <button
                type="button"
                className="ra-drawer__nav-btn"
                onClick={onNext}
                title="Next Receipt (→)"
                aria-label="Next Receipt"
              >
                <ChevronRight size={16} />
              </button>
            )}
            {draft && (
              <button
                type="button"
                className="ra-drawer__nav-btn"
                onClick={() => navigate(`${basePath}/${draft._id}`)}
                title="Open Full Detail Page"
                aria-label="Open Full Detail Page"
              >
                <ExternalLink size={15} />
              </button>
            )}
            <button
              type="button"
              className="ra-drawer__close"
              onClick={onClose}
              title="Close Drawer (Esc)"
              aria-label="Close Drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="ra-drawer__body">
          {loading ? (
            <div className="ra-state" style={{ minHeight: '400px' }}>
              <div className="ra-spinner" />
              <div className="ra-state__title" style={{ marginTop: 12 }}>
                Loading receipt data & high-res slip…
              </div>
            </div>
          ) : !draft ? (
            <div className="ra-state" style={{ minHeight: '300px' }}>
              <AlertTriangle size={28} color="var(--amber-500, #F59E0B)" />
              <div className="ra-state__title">Draft not found</div>
            </div>
          ) : (
            <div className="ra-drawer__split">
              {/* Left Column: Image Viewer */}
              <div className="ra-drawer__viewer-pane">
                <div className="ra-drawer__tab-strip">
                  <button
                    type="button"
                    className={`ra-drawer__tab ${activeTab === 'bill' ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveTab('bill');
                      setZoom(1);
                      setRotation(0);
                    }}
                  >
                    <Receipt size={14} />
                    Fuel Bill Slip
                  </button>
                  {draft.odometerImageUrl && (
                    <button
                      type="button"
                      className={`ra-drawer__tab ${activeTab === 'odometer' ? 'is-active' : ''}`}
                      onClick={() => {
                        setActiveTab('odometer');
                        setZoom(1);
                        setRotation(0);
                      }}
                    >
                      <Gauge size={14} />
                      Dashboard Odometer Photo
                    </button>
                  )}
                </div>

                <div className="ra-drawer__canvas">
                  {currentImg ? (
                    <img
                      src={currentImg}
                      alt="Bill receipt preview"
                      className="ra-drawer__img"
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      }}
                      draggable={false}
                    />
                  ) : (
                    <div className="ra-image-empty">
                      <Receipt size={32} />
                      <div>No image uploaded for this entry</div>
                    </div>
                  )}
                </div>

                {/* Image Toolbar */}
                {currentImg && (
                  <div className="ra-drawer__img-tools">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                      title="Zoom Out"
                      aria-label="Zoom Out"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <span className="ra-drawer__zoom-pct">{Math.round(zoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(z + 0.25, 3.5))}
                      title="Zoom In"
                      aria-label="Zoom In"
                    >
                      <ZoomIn size={15} />
                    </button>
                    <div className="ra-drawer__tool-divider" />
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      title="Rotate 90°"
                      aria-label="Rotate 90 degrees"
                    >
                      <RotateCw size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setZoom(1);
                        setRotation(0);
                      }}
                      title="Reset View"
                      aria-label="Reset View"
                    >
                      Reset
                    </button>
                    <a
                      href={currentImg}
                      target="_blank"
                      rel="noreferrer"
                      className="ra-drawer__full-link"
                      title="Open Full Resolution in new tab"
                    >
                      <Maximize2 size={13} /> Full Size
                    </a>
                  </div>
                )}
              </div>

              {/* Right Column: Verification & Audit Details */}
              <div className="ra-drawer__details-pane">
                {/* Math & Amount Banner */}
                <div className="ra-amount-hero">
                  <div className="ra-amount-hero__main">
                    <span className="ra-amount-hero__label">Total Billed Amount</span>
                    <span className="ra-amount-hero__val">{fmtMoney(draft.amount)}</span>
                  </div>
                  <div className="ra-amount-hero__sub">
                    <span className="ra-pill-chip">
                      <strong>{fmtLitres(draft.litres)}</strong> @ {fmtMoney(draft.rate)}/L
                    </span>
                    {ocrEval.math?.isValid && (
                      <span className="ra-pill-chip ra-pill-chip--success">
                        <CheckCircle2 size={13} /> Math Verified
                      </span>
                    )}
                    {ocrEval.math && !ocrEval.math.isValid && (
                      <span className="ra-pill-chip ra-pill-chip--warning">
                        <AlertTriangle size={13} /> Math Variance: ₹{Math.round(ocrEval.math.diff)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Section: Fuel & Vehicle Core Details */}
                <div className="ra-section-card">
                  <div className="ra-section-card__title">
                    <Receipt size={15} /> Fuel & Vehicle Extracted Data
                  </div>
                  <div className="ra-grid-props">
                    <div className="ra-prop">
                      <span className="ra-prop__label">Vehicle Reg</span>
                      <span className="ra-prop__val font-mono">{veh}</span>
                    </div>
                    <div className="ra-prop">
                      <span className="ra-prop__label">Fuel Type</span>
                      <span className="ra-prop__val">{draft.fuelType || 'DIESEL'}</span>
                    </div>
                    <div className="ra-prop">
                      <span className="ra-prop__label">Filling Mode</span>
                      <span className="ra-prop__val">{draft.fillingType || 'FULL_TANK'}</span>
                    </div>
                    <div className="ra-prop">
                      <span className="ra-prop__label">Bill Date & Time</span>
                      <span className="ra-prop__val">{fmtDate(draft.billDatetime)}</span>
                    </div>
                    <div className="ra-prop">
                      <span className="ra-prop__label">Plate (OCR Detected)</span>
                      <span className="ra-prop__val font-mono">
                        {draft.plateText || 'Not Detected'}
                      </span>
                    </div>
                    <div className="ra-prop">
                      <span className="ra-prop__label">Organization</span>
                      <span className="ra-prop__val">{draft.orgId?.companyName || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Triple-Check Odometer & Telematics */}
                <div className="ra-section-card">
                  <div className="ra-section-card__title">
                    <Gauge size={15} /> Triple-Check Odometer Audit
                  </div>
                  <div className="ra-odo-row">
                    <div className="ra-odo-box">
                      <span className="ra-odo-box__reading">{odoMeta.displayReading}</span>
                      <span className={`ra-odo-badge ${odoMeta.badgeClass}`}>
                        {odoMeta.badgeText}
                      </span>
                    </div>
                    <div className="ra-odo-hint">{odoMeta.detailHint}</div>
                  </div>
                </div>

                {/* Section: Station & Telematics Cross-Verification */}
                <div className="ra-section-card">
                  <div className="ra-section-card__title">
                    <MapPin size={15} /> Station & Telematics Verification
                  </div>
                  <div className="ra-grid-props">
                    <div className="ra-prop ra-prop--full">
                      <span className="ra-prop__label">Station Name</span>
                      <span className="ra-prop__val">{stationInfo.stationName}</span>
                    </div>
                    <div className="ra-prop">
                      <span className="ra-prop__label">Pump GPS Coordinates</span>
                      <span className="ra-prop__val font-mono">{stationInfo.coordinates}</span>
                    </div>
                    <div className="ra-prop">
                      <span className="ra-prop__label">Vehicle Halt Duration</span>
                      <span
                        className="ra-prop__val"
                        style={{ color: 'var(--emerald-500, #10B981)' }}
                      >
                        <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
                        {stationInfo.haltTime}
                      </span>
                    </div>
                    <div className="ra-prop">
                      <span className="ra-prop__label">State Diesel Benchmark</span>
                      <span className="ra-prop__val">₹{stationInfo.benchmarkRate}/L</span>
                    </div>
                    <div className="ra-prop">
                      <span className="ra-prop__label">Rate Variance</span>
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
                              stationInfo.isRateNormal ? 'Normal Variance' : 'High Variance'
                            })`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section: Driver & WhatsApp Submission Metadata */}
                <div className="ra-section-card">
                  <div className="ra-section-card__title">
                    <User size={15} /> Submitter & Audit Metadata
                  </div>
                  <div className="ra-grid-props">
                    <div className="ra-prop">
                      <span className="ra-prop__label">Submitted by</span>
                      <span className="ra-prop__val">{submitter}</span>
                    </div>
                    <div className="ra-prop">
                      <span className="ra-prop__label">WhatsApp Contact</span>
                      <span className="ra-prop__val font-mono">
                        {draft.phoneE164 || draft.waId || '—'}
                      </span>
                    </div>
                    <div className="ra-prop">
                      <span className="ra-prop__label">Received Timestamp</span>
                      <span className="ra-prop__val">
                        {fmtDate(draft.createdAt)} ({fmtRelativeTime(draft.createdAt)})
                      </span>
                    </div>
                    {draft.status === 'PUBLISHED' && (
                      <div className="ra-prop">
                        <span className="ra-prop__label">Approved by</span>
                        <span className="ra-prop__val">
                          {[draft.publishedBy?.firstName, draft.publishedBy?.lastName]
                            .filter(Boolean)
                            .join(' ') || 'Admin'}{' '}
                          on {fmtDate(draft.publishedAt)}
                        </span>
                      </div>
                    )}
                    {draft.status === 'REJECTED' && (
                      <div className="ra-prop ra-prop--full">
                        <span className="ra-prop__label">Rejection Reason</span>
                        <span
                          className="ra-prop__val"
                          style={{ color: 'var(--rose-500, #EF4444)' }}
                        >
                          {draft.rejectReason || 'No reason provided'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Action Footer */}
        {draft && (
          <div className="ra-drawer__footer">
            <div className="ra-drawer__footer-left">
              <span className="ra-drawer__footer-id">Ref #{draft._id.slice(-8)}</span>
            </div>

            <div className="ra-drawer__footer-actions">
              {isReady ? (
                <>
                  <button
                    type="button"
                    className="ra-btn ra-btn--clear"
                    onClick={handleClear}
                    disabled={actionBusy}
                  >
                    <Archive size={16} />
                    Clear
                  </button>
                  <button
                    type="button"
                    className="ra-btn ra-btn--reject"
                    onClick={() => setRejectModalOpen(true)}
                    disabled={actionBusy}
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                  <button
                    type="button"
                    className="ra-btn ra-btn--publish"
                    onClick={handlePublish}
                    disabled={actionBusy}
                  >
                    <CheckCircle2 size={16} />
                    {actionBusy ? 'Publishing…' : 'Approve & Publish'}
                  </button>
                </>
              ) : (
                <div className="ra-drawer__settled-state">
                  This draft is currently <strong>{draft.status}</strong>.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inline Reject Modal */}
        {rejectModalOpen && (
          <div className="ra-modal-overlay" onClick={() => setRejectModalOpen(false)}>
            <div className="ra-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ra-modal__head">Reject Fuel Receipt</div>
              <div className="ra-modal__body">
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--foreground)' }}>
                  State the reason for rejection (this will be recorded in the audit trail and sent
                  to the driver):
                </p>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Unclear bill photo, incorrect vehicle registration, suspicious pump rate…"
                  className="ra-modal__textarea"
                  aria-label="Rejection reason"
                />
              </div>
              <div className="ra-modal__foot">
                <button
                  type="button"
                  className="ra-btn ra-btn--ghost"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={actionBusy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ra-btn ra-btn--reject"
                  onClick={handleReject}
                  disabled={actionBusy}
                >
                  {actionBusy ? 'Rejecting…' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptApprovalDrawer;
