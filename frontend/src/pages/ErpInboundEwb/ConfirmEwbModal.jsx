import { X, Info, AlertTriangle, Truck } from 'lucide-react';

const ConfirmEwbModal = ({
  active,
  closeReview,
  handleConfirm,
  form,
  setField,
  placedTrips,
  submitting,
}) => (
  <div
    className="erp-modal-backdrop"
    role="presentation"
    onClick={(e) => {
      if (e.target === e.currentTarget) closeReview();
    }}
    onKeyDown={(e) => {
      if (e.key === 'Escape') closeReview();
    }}
  >
    <div className="erp-modal">
      <div className="erp-modal-header">
        <h2>Confirm {active.ewbNumber}</h2>
        <button className="btn-icon" onClick={closeReview}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleConfirm}>
        <div className="erp-modal-body">
          <div className="erp-callout info">
            <Info size={16} />
            <span>
              Confirming creates the consignment note on this trip, pre-filled from the waybill, and
              records the e-Way Bill against it permanently. A trip can carry only one CN.
            </span>
          </div>

          <div className="erp-field full" style={{ marginBottom: 16 }}>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- captions the read-only table below (aria-labelledby), not a form control; kept a <label> for the .erp-field label styling */}
            <label id="ewb-review-source-label">From the e-Way Bill</label>
            <table
              className="erp-table"
              style={{ minWidth: 0 }}
              aria-labelledby="ewb-review-source-label"
            >
              <tbody>
                <tr>
                  <td className="erp-cell-muted">Vehicle</td>
                  <td className="erp-cell-strong">{active.vehicleNumber || '—'}</td>
                </tr>
                <tr>
                  <td className="erp-cell-muted">Consignor GSTIN</td>
                  <td className="erp-cell-strong">{active.generatorGstin || '—'}</td>
                </tr>
                <tr>
                  <td className="erp-cell-muted">Material</td>
                  <td className="erp-cell-strong">{active.material || '—'}</td>
                </tr>
                <tr>
                  <td className="erp-cell-muted">Quantity</td>
                  <td className="erp-cell-strong erp-numeric">
                    {active.qty || 0} {active.qtyUnit || ''}
                  </td>
                </tr>
                <tr>
                  <td className="erp-cell-muted">Invoice</td>
                  <td className="erp-cell-strong">
                    {active.sourceInvoiceNumber || '—'}
                    {active.sourceInvoiceValue
                      ? ` · ₹${active.sourceInvoiceValue.toLocaleString('en-IN')}`
                      : ''}
                  </td>
                </tr>
                {active.matchReason && (
                  <tr>
                    <td className="erp-cell-muted">Match reason</td>
                    <td className="erp-cell-muted">{active.matchReason}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="erp-field full">
            <label htmlFor="ewb-trip">
              Trip <span className="required">*</span>
            </label>
            <select
              id="ewb-trip"
              value={form.tripId || ''}
              onChange={(e) => setField('tripId', e.target.value)}
              required
            >
              <option value="">Select a trip</option>
              {placedTrips.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.tripNumber} — {t.vehicleNumber || t.material} ({t.state})
                </option>
              ))}
            </select>
            <span className="erp-field-hint">
              <Truck size={12} /> Only placed trips can take a CN.
            </span>
          </div>

          <div className="erp-field">
            <label htmlFor="ewb-cnno">CN number</label>
            <input
              id="ewb-cnno"
              aria-label="CN number"
              value={form.cnNumber || ''}
              onChange={(e) => setField('cnNumber', e.target.value)}
              placeholder="Defaults to the invoice / EWB number"
            />
          </div>

          <div className="erp-field">
            <label htmlFor="ewb-cndate">CN date</label>
            <input
              id="ewb-cndate"
              aria-label="CN date"
              type="date"
              value={form.cnDate || ''}
              onChange={(e) => setField('cnDate', e.target.value)}
            />
            <span className="erp-field-hint">Must be within ±2 days of the trip date.</span>
          </div>

          <div className="erp-field">
            <label htmlFor="ewb-loaddate">Loading date</label>
            <input
              id="ewb-loaddate"
              aria-label="Loading date"
              type="date"
              value={form.loadingDate || ''}
              onChange={(e) => setField('loadingDate', e.target.value)}
            />
          </div>

          <div className="erp-field">
            <label htmlFor="ewb-qty">Loaded qty</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="ewb-qty"
                aria-label="Loaded qty"
                type="number"
                min="0"
                step="any"
                value={form.loadedQty ?? ''}
                onChange={(e) => setField('loadedQty', e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                aria-label="Loaded quantity unit"
                value={form.loadedQtyUnit || 'KL'}
                onChange={(e) => setField('loadedQtyUnit', e.target.value)}
                style={{ width: 90 }}
              >
                <option value="KL">KL</option>
                <option value="MT">MT</option>
              </select>
            </div>
          </div>

          {active.matchStatus === 'UNMATCHED' && (
            <div className="erp-callout warning" style={{ marginTop: 16 }}>
              <AlertTriangle size={16} />
              <span>
                The matcher could not tie this waybill to a trip. Check the vehicle number and pick
                the trip yourself before confirming.
              </span>
            </div>
          )}
        </div>

        <div className="erp-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeReview}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Confirming…' : 'Confirm & create CN'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default ConfirmEwbModal;
