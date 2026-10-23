import { X, Info } from 'lucide-react';
import UNITS from './rateUnits';

const RateModal = ({ setShowModal, handleSubmit, form, setField, parties, routes, saving }) => (
  <div
    className="erp-modal-backdrop"
    role="presentation"
    onClick={(e) => {
      if (e.target === e.currentTarget) setShowModal(false);
    }}
  >
    <div className="erp-modal">
      <div className="erp-modal-header">
        <h2>Add Rate</h2>
        <button className="btn-icon" onClick={() => setShowModal(false)}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="erp-modal-body">
          <div className="erp-callout info">
            <Info size={16} />
            <span>
              Adding a rate for a combination that already has one closes the older rate on this
              date. Orders already raised keep the rate they were created with.
            </span>
          </div>

          <div className="erp-form-grid">
            <div className="erp-field full">
              <label htmlFor="rate-party">
                Party <span className="required">*</span>
              </label>
              <select
                id="rate-party"
                value={form.partyId}
                onChange={(e) => setField('partyId', e.target.value)}
                required
              >
                <option value="">Select a party</option>
                {parties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="erp-field full">
              <label htmlFor="rate-route">
                Route <span className="required">*</span>
              </label>
              <select
                id="rate-route"
                value={form.routeId}
                onChange={(e) => setField('routeId', e.target.value)}
                required
              >
                <option value="">Select a route</option>
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {routes.length === 0 && (
                <span className="erp-field-hint">No routes yet — add one under Routes first.</span>
              )}
            </div>

            <div className="erp-field">
              <label htmlFor="rate-material">
                Material <span className="required">*</span>
              </label>
              <input
                id="rate-material"
                aria-label="Material"
                value={form.material}
                onChange={(e) => setField('material', e.target.value.toUpperCase())}
                placeholder="MTO"
                required
              />
            </div>

            <div className="erp-field">
              <label htmlFor="rate-effective">
                Effective From <span className="required">*</span>
              </label>
              <input
                id="rate-effective"
                aria-label="Effective From"
                type="date"
                value={form.effectiveFrom}
                onChange={(e) => setField('effectiveFrom', e.target.value)}
                required
              />
            </div>

            <div className="erp-field">
              <label htmlFor="rate-amount">
                Rate (₹) <span className="required">*</span>
              </label>
              <input
                id="rate-amount"
                aria-label="Rate (₹)"
                type="number"
                min="0"
                step="0.01"
                value={form.rate}
                onChange={(e) => setField('rate', e.target.value)}
                placeholder="4500"
                required
              />
            </div>

            <div className="erp-field">
              <label htmlFor="rate-unit">
                Unit <span className="required">*</span>
              </label>
              <select
                id="rate-unit"
                value={form.unit}
                onChange={(e) => setField('unit', e.target.value)}
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="erp-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Rate'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default RateModal;
