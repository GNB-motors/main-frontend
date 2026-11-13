import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Receipt,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ReceiptApprovalService } from './ReceiptApprovalService';
import DrawerViewerPane from './receipts/DrawerViewerPane';
import DrawerDetailsPane from './receipts/DrawerDetailsPane';
import ChatDraftEditor from './receipts/ChatDraftEditor';
import ReceiptApprovalActions from './receipts/ReceiptApprovalActions';
import { useReceiptApprovalActions } from './receipts/useReceiptApprovalActions';
import { initialChatEdits, isChatRow } from './receipts/chatDraft';
import { plainActionError } from './receipts/receiptActions';
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
  // What a person changed in the drawer, ready to be saved with the approve.
  const [edits, setEdits] = useState(null);
  // The org's vehicles, for the truck picker of a chat-import row.
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesError, setVehiclesError] = useState('');
  const [closeNotice, setCloseNotice] = useState('');

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
      setActionError(plainActionError(err, 'We could not load this receipt. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [draftId, loadVehicles]);

  const {
    rejectModalOpen,
    setRejectModalOpen,
    rejectReason,
    setRejectReason,
    shakeCount,
    publishButtonRef,
    visibleMissing,
    handleSetTime,
    handlePublish,
    handleMarket,
    handleReject,
    handleClear,
  } = useReceiptApprovalActions({
    draft,
    edits,
    loadDraft,
    onUpdated,
    actionBusy,
    setActionBusy,
    setActionError,
  });

  useEffect(() => {
    if (isOpen && draftId) {
      loadDraft();
    }
  }, [isOpen, draftId, loadDraft]);

  // Handle escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !rejectModalOpen) closeRef.current();
      if (e.key === 'Escape' && rejectModalOpen) setRejectModalOpen(false);
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
      if (e.key === 'ArrowRight' && hasNext) onNext?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onPrev, onNext, hasPrev, hasNext, rejectModalOpen, setRejectModalOpen]);

  // Work that closing the drawer would throw away: the edits the person made
  // in the form that have not been approved yet.
  const unsavedEdits =
    Boolean(draft) &&
    Boolean(edits) &&
    JSON.stringify(edits) !== JSON.stringify(initialChatEdits(draft));

  // The drawer closes only when nothing would be lost.
  const closeDrawer = () => {
    if (actionBusy) {
      setCloseNotice('Saving — please wait for it to finish.');
      return;
    }
    // A rejection in progress owns the screen: its own words are on it.
    if (rejectModalOpen) return;
    if (unsavedEdits) {
      setCloseNotice('You have unsaved changes');
      return;
    }
    onClose?.();
  };
  // Escape must reach the same guard without re-registering the listener.
  const closeRef = useRef(closeDrawer);
  closeRef.current = closeDrawer;

  if (!isOpen) return null;

  const veh = draft?.vehicleId?.registrationNumber || draft?.vehicleReg || '—';
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
    <div
      className="ra-drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        // Only a press that starts on the dimmed background closes the drawer:
        // a drag that starts inside the panel and ends outside must not.
        if (event.target !== event.currentTarget) return;
        closeDrawer();
      }}
    >
      <div className="ra-drawer" role="presentation">
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
              onClick={closeDrawer}
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
                  edits={edits}
                  ocrEval={ocrEval}
                  veh={veh}
                  odoMeta={odoMeta}
                  stationInfo={stationInfo}
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
        {closeNotice && (
          <div className="ra-alert" role="alert">
            <AlertTriangle size={16} />
            <span>{closeNotice}</span>
          </div>
        )}
        {actionError && (
          <div className="ra-alert ra-alert--error" role="alert">
            <AlertTriangle size={16} />
            <span>{actionError}</span>
          </div>
        )}

        <ReceiptApprovalActions
          draft={draft}
          isReady={isReady}
          isChat={isChat}
          actionBusy={actionBusy}
          visibleMissing={visibleMissing}
          shakeCount={shakeCount}
          publishButtonRef={publishButtonRef}
          handleClear={handleClear}
          handleMarket={handleMarket}
          handlePublish={handlePublish}
          handleReject={handleReject}
          rejectModalOpen={rejectModalOpen}
          setRejectModalOpen={setRejectModalOpen}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
        />
      </div>
    </div>
  );
};

export default ReceiptApprovalDrawer;
