import React from 'react';

function ReceiptForm({ receiptForm, setReceiptForm, parties, busy, submitReceipt }) {
  return (
    <form className="erp-card erp-form-grid" onSubmit={submitReceipt}>
      <label>
        Party
        <select
          required
          value={receiptForm.partyId}
          onChange={(e) => setReceiptForm({ ...receiptForm, partyId: e.target.value })}
        >
          <option value="">Select party</option>
          {parties.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
      </label>
      <label>
        Amount
        <input
          aria-label="Amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={receiptForm.amount}
          onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
        />
      </label>
      <label>
        Receipt date
        <input
          aria-label="Receipt date"
          type="date"
          required
          value={receiptForm.receiptDate}
          onChange={(e) => setReceiptForm({ ...receiptForm, receiptDate: e.target.value })}
        />
      </label>
      <label>
        Mode
        <select
          value={receiptForm.mode}
          onChange={(e) => setReceiptForm({ ...receiptForm, mode: e.target.value })}
        >
          {['CASH', 'BANK', 'CHEQUE', 'UPI', 'NEFT', 'RTGS'].map((m) => (
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
          value={receiptForm.instrumentNo}
          onChange={(e) => setReceiptForm({ ...receiptForm, instrumentNo: e.target.value })}
        />
      </label>
      <label>
        Bank
        <input
          aria-label="Bank"
          value={receiptForm.bankName}
          onChange={(e) => setReceiptForm({ ...receiptForm, bankName: e.target.value })}
        />
      </label>
      <label className="full-width">
        Narration
        <input
          aria-label="Narration"
          value={receiptForm.narration}
          onChange={(e) => setReceiptForm({ ...receiptForm, narration: e.target.value })}
        />
      </label>
      <div className="erp-form-actions full-width">
        <button type="submit" className="erp-btn primary" disabled={busy}>
          Record receipt
        </button>
      </div>
    </form>
  );
}

export default ReceiptForm;
