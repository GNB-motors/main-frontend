import { Archive, CheckCircle2, Store, XCircle } from 'lucide-react';

const ReceiptApprovalActions = ({
  draft,
  isReady,
  isChat,
  actionBusy,
  visibleMissing,
  shakeCount,
  publishButtonRef,
  handleClear,
  handleMarket,
  handlePublish,
  handleReject,
  rejectModalOpen,
  setRejectModalOpen,
  rejectReason,
  setRejectReason,
}) => (
  <>
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
                key={`publish-${shakeCount}`}
                ref={publishButtonRef}
                type="button"
                className={`ra-btn ra-btn--publish${visibleMissing.length ? ' ra-btn--blocked ra-btn--shake' : ''}`}
                onClick={handlePublish}
                disabled={actionBusy}
                aria-describedby={visibleMissing.length ? 'ra-key-blocked-message' : undefined}
              >
                <CheckCircle2 size={16} />
                {actionBusy ? 'Publishing…' : 'Approve & Publish'}
              </button>
              {visibleMissing.length > 0 && (
                <span id="ra-key-blocked-message" className="ra-key-blocked-alert" role="alert">
                  Key field missing: {visibleMissing.map((field) => field.label).join(', ')}
                </span>
              )}
            </>
          ) : (
            <div className="ra-drawer__settled-state">
              This draft is currently <strong>{draft.status}</strong>.
            </div>
          )}
        </div>
      </div>
    )}

    {rejectModalOpen && (
      <div
        className="ra-modal-overlay"
        role="presentation"
        onClick={() => setRejectModalOpen(false)}
      >
        <div className="ra-modal" role="presentation" onClick={(event) => event.stopPropagation()}>
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
              onChange={(event) => setRejectReason(event.target.value)}
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
  </>
);

export default ReceiptApprovalActions;
