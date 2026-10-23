import React from 'react';
import { X } from 'lucide-react';
import { todayInput } from '../todayInput';

function ReceiveBillModal({
  receiveTarget,
  closeModal,
  handleReceived,
  receivedDate,
  setReceivedDate,
  busy,
}) {
  return (
    <div className="erp-modal-backdrop">
      <div className="erp-modal" style={{ maxWidth: 420 }}>
        <div className="erp-modal-header">
          <h2>Party received — {receiveTarget.billNumber}</h2>
          <button type="button" className="erp-icon-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleReceived} className="erp-form">
          <p className="erp-muted">Due date will be computed from this date + party credit days.</p>
          <label>
            Party received date
            <input
              aria-label="Party received date"
              type="date"
              required
              max={todayInput()}
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
            />
          </label>
          <div className="erp-modal-actions">
            <button type="submit" className="erp-btn erp-btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Mark received'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReceiveBillModal;
