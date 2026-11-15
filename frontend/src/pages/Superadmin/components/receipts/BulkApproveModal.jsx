import { useState } from 'react';
import { fmtMoney, fmtLitres } from './receiptFormat';

const BulkApproveModal = ({
  bulkBusy,
  setShowBulkApproveModal,
  selectedIds,
  totalSelectedLitres,
  totalSelectedAmount,
  handleBulkApprove,
}) => {
  const [blockedRows, setBlockedRows] = useState([]);

  const approve = async () => {
    setBlockedRows([]);
    const result = await handleBulkApprove();
    if (result?.missing?.length > 0) setBlockedRows(result.missing);
  };

  return (
    <div
      className="ra-modal-overlay"
      role="presentation"
      onClick={() => !bulkBusy && setShowBulkApproveModal(false)}
      onKeyDown={(event) =>
        event.key === 'Escape' && !bulkBusy && setShowBulkApproveModal(false)
      }
    >
      <div className="ra-modal" role="presentation" onClick={(event) => event.stopPropagation()}>
        <div className="ra-modal__head">Bulk Publish to Fuel Ledger</div>
        <div className="ra-modal__body">
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--foreground)' }}>
            Are you sure you want to approve and publish <strong>{selectedIds.size}</strong> fuel
            receipt{selectedIds.size === 1 ? '' : 's'} into the official fleet fuel ledger?
          </p>
          <div className="ra-bulk-summary-box">
            <div className="ra-bulk-summary-row">
              <span>Selected Receipts:</span>
              <strong>{selectedIds.size}</strong>
            </div>
            <div className="ra-bulk-summary-row">
              <span>Total Diesel Volume:</span>
              <strong className="font-mono">{fmtLitres(totalSelectedLitres)}</strong>
            </div>
            <div className="ra-bulk-summary-row">
              <span>Total Bill Amount:</span>
              <strong className="font-mono">{fmtMoney(totalSelectedAmount)}</strong>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-foreground)' }}>
            A TripFuelLog entry will be created atomically for each vehicle.
          </p>
          {blockedRows.length > 0 && (
            <div className="ra-alert ra-alert--error" role="alert">
              <strong>{blockedRows.length} not approved: key field missing</strong>
              <ul className="ra-bulk-blocked-list">
                {blockedRows.map((row) => (
                  <li key={row.id}>
                    {row.name} — {row.missing.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="ra-modal__foot">
          <button
            type="button"
            className="ra-btn ra-btn--ghost"
            onClick={() => setShowBulkApproveModal(false)}
            disabled={bulkBusy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ra-btn ra-btn--publish"
            onClick={approve}
            disabled={bulkBusy}
          >
            {bulkBusy ? 'Publishing…' : `Confirm & Publish (${selectedIds.size})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkApproveModal;
