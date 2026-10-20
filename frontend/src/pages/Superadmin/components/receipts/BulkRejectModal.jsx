import { fmtMoney } from './receiptFormat';
const BulkRejectModal = ({
  bulkBusy,
  setShowBulkRejectModal,
  selectedIds,
  totalSelectedAmount,
  bulkRejectReason,
  setBulkRejectReason,
  handleBulkReject,
}) => (
  <div
    className="ra-modal-overlay"
    role="presentation"
    onClick={() => !bulkBusy && setShowBulkRejectModal(false)}
    onKeyDown={(e) => e.key === 'Escape' && !bulkBusy && setShowBulkRejectModal(false)}
  >
    <div className="ra-modal" role="presentation" onClick={(e) => e.stopPropagation()}>
      <div className="ra-modal__head" style={{ color: 'var(--rose-500, #EF4444)' }}>
        Bulk Reject Fuel Receipts
      </div>
      <div className="ra-modal__body">
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--foreground)' }}>
          Are you sure you want to reject <strong>{selectedIds.size}</strong> fuel receipt
          {selectedIds.size === 1 ? '' : 's'}?
        </p>
        <div className="ra-bulk-summary-box" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <div className="ra-bulk-summary-row">
            <span>Receipts to Reject:</span>
            <strong>{selectedIds.size}</strong>
          </div>
          <div className="ra-bulk-summary-row">
            <span>Total Value:</span>
            <strong className="font-mono">{fmtMoney(totalSelectedAmount)}</strong>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label
            htmlFor="bulk-reject-reason-input"
            className="ra-field__label"
            style={{ marginBottom: 6, display: 'block' }}
          >
            Rejection Reason (Recorded in audit trail):
          </label>
          <textarea
            id="bulk-reject-reason-input"
            rows={2}
            className="ra-modal__textarea"
            value={bulkRejectReason}
            onChange={(e) => setBulkRejectReason(e.target.value)}
            placeholder="e.g. Unclear pump slips, duplicate entry, rate discrepancy…"
            aria-label="Rejection reason for bulk reject"
          />
        </div>
      </div>
      <div className="ra-modal__foot">
        <button
          type="button"
          className="ra-btn ra-btn--ghost"
          onClick={() => setShowBulkRejectModal(false)}
          disabled={bulkBusy}
        >
          Cancel
        </button>
        <button
          type="button"
          className="ra-btn ra-btn--reject"
          onClick={handleBulkReject}
          disabled={bulkBusy}
        >
          {bulkBusy ? 'Rejecting…' : `Confirm Rejection (${selectedIds.size})`}
        </button>
      </div>
    </div>
  </div>
);

export default BulkRejectModal;
