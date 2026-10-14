import React from 'react';

function SupplierReleaseModal({
  releaseTarget,
  releaseForm,
  setReleaseForm,
  setReleaseTarget,
  busy,
  releasePayment,
}) {
  return (
    <div className="erp-modal-backdrop">
      <div className="erp-modal erp-card">
        <h3>Release {releaseTarget.paymentNumber}</h3>
        <label>
          Mode
          <select
            value={releaseForm.paymentMode}
            onChange={(e) => setReleaseForm({ ...releaseForm, paymentMode: e.target.value })}
          >
            {['NEFT', 'RTGS', 'CHEQUE', 'UPI', 'BANK', 'CASH'].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label>
          Instrument no
          <input
            aria-label="Instrument no"
            value={releaseForm.instrumentNo}
            onChange={(e) => setReleaseForm({ ...releaseForm, instrumentNo: e.target.value })}
          />
        </label>
        <div className="erp-form-actions">
          <button type="button" className="erp-btn" onClick={() => setReleaseTarget(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="erp-btn primary"
            disabled={busy}
            onClick={releasePayment}
          >
            Release
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupplierReleaseModal;
