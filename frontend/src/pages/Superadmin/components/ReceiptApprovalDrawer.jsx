import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Archive,
  Receipt,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ReceiptApprovalService } from './ReceiptApprovalService';
import DrawerViewerPane from './receipts/DrawerViewerPane';
import DrawerDetailsPane from './receipts/DrawerDetailsPane';
import {
  evaluateOcrQuality,
  getOdometerMeta,
  crossVerifyStation,
} from './receipts/receiptVerification';

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
      const data = await ReceiptApprovalService.getDraft(draftId);
      setDraft(data || null);
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
      if (e.key === 'Escape' && rejectModalOpen) setRejectModalOpen(false);
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
      await ReceiptApprovalService.publishDraft(draft._id);
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
      await ReceiptApprovalService.rejectDraft(draft._id, rejectReason.trim() || undefined);
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
      await ReceiptApprovalService.clearDraft(draft._id, 'Cleared from drawer');
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
    <div className="ra-drawer-backdrop" role="presentation" onClick={onClose}>
      <div className="ra-drawer" role="presentation" onClick={(e) => e.stopPropagation()}>
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
              <DrawerViewerPane
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setZoom={setZoom}
                setRotation={setRotation}
                draft={draft}
                currentImg={currentImg}
                zoom={zoom}
                rotation={rotation}
              />

              {/* Right Column: Verification & Audit Details */}
              <DrawerDetailsPane
                draft={draft}
                ocrEval={ocrEval}
                veh={veh}
                odoMeta={odoMeta}
                stationInfo={stationInfo}
                submitter={submitter}
              />
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
          <div
            className="ra-modal-overlay"
            role="presentation"
            onClick={() => setRejectModalOpen(false)}
          >
            <div className="ra-modal" role="presentation" onClick={(e) => e.stopPropagation()}>
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
