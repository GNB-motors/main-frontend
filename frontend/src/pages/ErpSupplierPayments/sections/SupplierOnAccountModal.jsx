import React from 'react';
import { money } from '../money';

function SupplierOnAccountModal({
  onAccount,
  selectedVoucherIds,
  setSelectedVoucherIds,
  submitPayment,
  busy,
}) {
  return (
    <div className="erp-modal-backdrop">
      <div className="erp-modal erp-card">
        <h3>Apply on-account ({money(onAccount.available)})</h3>
        <ul className="erp-list">
          {(onAccount.vouchers || []).map((v) => (
            <li key={v.voucherId}>
              <label>
                <input
                  type="checkbox"
                  aria-label={`${v.voucherNumber} — ${money(v.unadjustedAmount)}`}
                  checked={selectedVoucherIds.has(v.voucherId)}
                  onChange={() =>
                    setSelectedVoucherIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(v.voucherId)) next.delete(v.voucherId);
                      else next.add(v.voucherId);
                      return next;
                    })
                  }
                />
                {v.voucherNumber} — {money(v.unadjustedAmount)}
              </label>
            </li>
          ))}
        </ul>
        <div className="erp-form-actions">
          <button type="button" className="erp-btn" onClick={() => submitPayment([])}>
            Skip
          </button>
          <button
            type="button"
            className="erp-btn primary"
            disabled={busy}
            onClick={() => submitPayment([...selectedVoucherIds])}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupplierOnAccountModal;
