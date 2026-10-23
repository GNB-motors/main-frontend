import { Check, CheckCircle2, XCircle } from 'lucide-react';
import { fmtMoney, fmtLitres } from './receiptFormat';
const BulkActionBar = ({
  selectedIds,
  totalSelectedLitres,
  totalSelectedAmount,
  clearSelection,
  bulkBusy,
  setShowBulkRejectModal,
  setShowBulkApproveModal,
}) => (
  <div className="ra-bulk-bar">
    <div className="ra-bulk-bar__content">
      <div className="ra-bulk-bar__left">
        <span className="ra-bulk-bar__badge">
          <Check size={14} />
          {selectedIds.size} Selected
        </span>
        <div className="ra-bulk-bar__divider" />
        <span className="ra-bulk-bar__stat">
          <span className="ra-bulk-bar__stat-label">Total Litres:</span>
          <span className="ra-bulk-bar__stat-val">{fmtLitres(totalSelectedLitres)}</span>
        </span>
        <div className="ra-bulk-bar__divider" />
        <span className="ra-bulk-bar__stat">
          <span className="ra-bulk-bar__stat-label">Total Amount:</span>
          <span className="ra-bulk-bar__stat-val">{fmtMoney(totalSelectedAmount)}</span>
        </span>
      </div>

      <div className="ra-bulk-bar__actions">
        <button
          type="button"
          className="ra-bulk-btn ra-bulk-btn--ghost"
          onClick={clearSelection}
          disabled={bulkBusy}
        >
          Cancel
        </button>

        <button
          type="button"
          className="ra-bulk-btn ra-bulk-btn--reject"
          onClick={() => setShowBulkRejectModal(true)}
          disabled={bulkBusy}
        >
          <XCircle size={15} />
          Reject {selectedIds.size}
        </button>

        <button
          type="button"
          className="ra-bulk-btn ra-bulk-btn--primary"
          onClick={() => setShowBulkApproveModal(true)}
          disabled={bulkBusy}
        >
          <CheckCircle2 size={16} />
          Approve {selectedIds.size} {selectedIds.size === 1 ? 'Receipt' : 'Receipts'}
        </button>
      </div>
    </div>
  </div>
);

export default BulkActionBar;
