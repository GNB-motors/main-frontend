import React from 'react';
import { X } from 'lucide-react';
import { todayInput } from '../todayInput';

function SubmitBillModal({
  submitTarget,
  closeModal,
  handleSubmit,
  submitForm,
  setSubmitForm,
  busy,
}) {
  return (
    <div className="erp-modal-backdrop">
      <div className="erp-modal" style={{ maxWidth: 480 }}>
        <div className="erp-modal-header">
          <h2>Submit {submitTarget.billNumber}</h2>
          <button type="button" className="erp-icon-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="erp-form">
          <label>
            Submit date
            <input
              aria-label="Submit date"
              type="date"
              required
              max={todayInput()}
              value={submitForm.submittedDate}
              onChange={(e) => setSubmitForm((f) => ({ ...f, submittedDate: e.target.value }))}
            />
          </label>
          <label>
            Delivery mode
            <select
              value={submitForm.deliveryMode}
              onChange={(e) => setSubmitForm((f) => ({ ...f, deliveryMode: e.target.value }))}
            >
              <option value="COURIER">Courier</option>
              <option value="BY_HAND">By hand</option>
              <option value="EMAIL">Email</option>
            </select>
          </label>
          {submitForm.deliveryMode === 'COURIER' && (
            <>
              <label>
                Courier name
                <input
                  aria-label="Courier name"
                  type="text"
                  required
                  value={submitForm.courierName}
                  onChange={(e) => setSubmitForm((f) => ({ ...f, courierName: e.target.value }))}
                />
              </label>
              <label>
                Docket #
                <input
                  aria-label="Docket #"
                  type="text"
                  required
                  value={submitForm.courierDocket}
                  onChange={(e) => setSubmitForm((f) => ({ ...f, courierDocket: e.target.value }))}
                />
              </label>
            </>
          )}
          {submitForm.deliveryMode === 'BY_HAND' && (
            <label>
              Handed to
              <input
                aria-label="Handed to"
                type="text"
                required
                value={submitForm.handDeliveredTo}
                onChange={(e) => setSubmitForm((f) => ({ ...f, handDeliveredTo: e.target.value }))}
              />
            </label>
          )}
          <div className="erp-modal-actions">
            <button type="submit" className="erp-btn erp-btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Record submission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubmitBillModal;
