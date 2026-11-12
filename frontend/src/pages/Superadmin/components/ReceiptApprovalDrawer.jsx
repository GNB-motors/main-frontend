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
  Store,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ReceiptApprovalService } from './ReceiptApprovalService';
import DrawerViewerPane from './receipts/DrawerViewerPane';
import DrawerDetailsPane from './receipts/DrawerDetailsPane';
import ChatDraftEditor from './receipts/ChatDraftEditor';
import { initialChatEdits, isChatRow, publishPayload } from './receipts/chatDraft';
import { plainActionError, refusalMessage } from './receipts/receiptActions';
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
  const [actionError, setActionError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState('bill'); // 'bill' | 'odometer'
  const [photoIndex, setPhotoIndex] = useState(0);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  // What a person changed in the drawer, ready to be saved with the approve.
  const [edits, setEdits] = useState(null);
  // The org's vehicles, for the truck picker of a chat-import row.
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesError, setVehiclesError] = useState('');

  const loadVehicles = useCallback(async () => {
    try {
      const rows = await ReceiptApprovalService.listVehicles();
      setVehicles(Array.isArray(rows) ? rows : []);
      setVehiclesError('');
    } catch (err) {
      setVehicles([]);
      setVehiclesError(
        plainActionError(err, 'We could not load the fleet list. Type the truck instead.'),
      );
    }
  }, []);

  // Fetch complete draft details with presigned URLs
  const loadDraft = useCallback(async () => {
    if (!draftId) return;
    setLoading(true);
    setZoom(1);
    setRotation(0);
    setPhotoIndex(0);
    setActionError('');
    try {
      const data = await ReceiptApprovalService.getDraft(draftId);
      setDraft(data || null);
      setEdits(initialChatEdits(data));
      if (isChatRow(data)) loadVehicles();
    } catch (err) {
      setActionError(
        plainActionError(err, 'We could not load this receipt. Please try again.'),
      );
    } finally {
      setLoading(false);
    }
  }, [draftId, loadVehicles]);

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

  // The time of the fill, set by a person: accept the prediction, or type it.
  const handleSetTime = async (action, at) => {
    if (!draft?._id || actionBusy) return;
    setActionBusy(true);
    setActionError('');
    try {
      await ReceiptApprovalService.setDraftTime(
        draft._id,
        action === 'accept' ? { action: 'accept' } : { action: 'set', at },
      );
      toast.success(
        action === 'accept' ? 'The predicted time was accepted' : 'The time of the fill was saved',
      );
      await loadDraft();
      onUpdated?.();
    } catch (err) {
      setActionError(plainActionError(err, 'Could not save the time'));
    } finally {
      setActionBusy(false);
    }
  };

  // Publish action. A chat-import row is saved with what the person changed.
  const handlePublish = async () => {
    if (!draft?._id || actionBusy) return;
    setActionBusy(true);
    setActionError('');
    try {
      const payload = isChatRow(draft) ? publishPayload(edits) : {};
      const result = await ReceiptApprovalService.publishDraft(draft._id, payload);
      // A resolved promise is not always a success: the server can refuse.
      const refusal = refusalMessage(
        result,
        'The receipt was not approved. Please check the details and try again.',
      );
      if (refusal) {
        setActionError(refusal);
        return;
      }
      const veh = draft.vehicleId?.registrationNumber || draft.vehicleReg || 'vehicle';
      toast.success(`Published receipt for ${veh} to Fuel Ledger`);
      await loadDraft();
      onUpdated?.();
    } catch (err) {
      setActionError(
        plainActionError(err, 'The receipt was not approved. Please try again.'),
      );
    } finally {
      setActionBusy(false);
    }
  };

  // A truck that is not in our fleet: the fill is saved without a vehicle.
  const handleMarket = async () => {
    if (!draft?._id || actionBusy) return;
    setActionBusy(true);
    setActionError('');
    try {
      const result = await ReceiptApprovalService.markDraftAsMarket(
        draft._id,
        publishPayload(edits),
      );
      const refusal = refusalMessage(
        result,
        'The row was not marked as a market truck. Please try again.',
      );
      if (refusal) {
        setActionError(refusal);
        return;
      }
      toast.success('Marked as a market truck — no fleet vehicle needed');
      await loadDraft();
      onUpdated?.();
    } catch (err) {
      setActionError(
        plainActionError(err, 'The row was not marked as a market truck. Please try again.'),
      );
    } finally {
      setActionBusy(false);
    }
  };

  // Reject action. On a chat-import row this keeps the row as "not a fill".
  const handleReject = async () => {
    if (!draft?._id || actionBusy) return;
    setActionBusy(true);
    setActionError('');
    try {
      await ReceiptApprovalService.rejectDraft(draft._id, rejectReason.trim() || undefined);
      toast.success(
        isChatRow(draft)
          ? 'Kept as “not a fill” — the photo stays in the inbox'
          : 'Receipt marked as rejected',
      );
      setRejectModalOpen(false);
      setRejectReason('');
      await loadDraft();
      onUpdated?.();
    } catch (err) {
      setActionError(plainActionError(err, 'The receipt was not rejected. Please try again.'));
    } finally {
      setActionBusy(false);
    }
  };

  // Clear action
  const handleClear = async () => {
    if (!draft?._id || actionBusy) return;
    setActionBusy(true);
    setActionError('');
    try {
      await ReceiptApprovalService.clearDraft(draft._id, 'Cleared from drawer');
      toast.success('Receipt cleared from inbox');
      await loadDraft();
      onUpdated?.();
    } catch (err) {
      setActionError(plainActionError(err, 'The receipt was not cleared. Please try again.'));
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
  const isChat = isChatRow(draft);
  const chatPhotos = Array.isArray(draft?.photos) ? draft.photos : [];

  const currentImg = chatPhotos.length
    ? chatPhotos[photoIndex]?.url
    : activeTab === 'odometer'
      ? draft?.odometerImageUrl
      : draft?.fuelImageUrl;

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
                photos={chatPhotos}
                photoIndex={photoIndex}
                setPhotoIndex={setPhotoIndex}
              />

              {/* Right Column: Verification & Audit Details */}
              <div className="ra-drawer__details-col">
                <DrawerDetailsPane
                  draft={draft}
                  ocrEval={ocrEval}
                  veh={veh}
                  odoMeta={odoMeta}
                  stationInfo={stationInfo}
                  submitter={submitter}
                  onSetTime={handleSetTime}
                  timeBusy={actionBusy}
                  showTimeBlock={!isChat}
                />
                {isChat && (
                  <ChatDraftEditor
                    draft={draft}
                    edits={edits}
                    onChange={setEdits}
                    vehicles={vehicles}
                    vehiclesError={vehiclesError}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* A refusal belongs to this row: the words sit in the drawer. */}
        {actionError && (
          <div className="ra-alert ra-alert--error" role="alert">
            <AlertTriangle size={16} />
            <span>{actionError}</span>
          </div>
        )}

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
                  {isChat && (
                    <button
                      type="button"
                      className="ra-btn ra-btn--clear"
                      onClick={handleMarket}
                      disabled={actionBusy}
                    >
                      <Store size={16} />
                      Market truck
                    </button>
                  )}
                  <button
                    type="button"
                    className="ra-btn ra-btn--reject"
                    onClick={() => setRejectModalOpen(true)}
                    disabled={actionBusy}
                  >
                    <XCircle size={16} />
                    {isChat ? 'Not a fill' : 'Reject'}
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
              <div className="ra-modal__head">
                {isChat ? 'This photo is not a fill' : 'Reject Fuel Receipt'}
              </div>
              <div className="ra-modal__body">
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--foreground)' }}>
                  {isChat
                    ? 'This row is kept as “not a fill”. The photo is not deleted — it stays in the inbox so you can find it later.'
                    : 'State the reason for rejection (this will be recorded in the audit trail and sent to the driver):'}
                </p>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={
                    isChat
                      ? 'e.g. A photo of the pump, not a bill…'
                      : 'e.g. Unclear bill photo, incorrect vehicle registration, suspicious pump rate…'
                  }
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
                  {actionBusy
                    ? 'Saving…'
                    : isChat
                      ? 'Keep as not a fill'
                      : 'Confirm Rejection'}
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
