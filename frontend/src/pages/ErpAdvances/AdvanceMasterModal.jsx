import { X } from 'lucide-react';
import TABS from './advanceMasterTabs';

const AdvanceMasterModal = ({
  tab,
  setShowModal,
  handleSubmit,
  form,
  setField,
  routes,
  saving,
}) => (
  <div
    className="erp-modal-backdrop"
    role="presentation"
    onClick={(e) => {
      if (e.target === e.currentTarget) setShowModal(false);
    }}
  >
    <div className="erp-modal">
      <div className="erp-modal-header">
        <h2>Add {TABS.find((t) => t.key === tab).label}</h2>
        <button className="btn-icon" onClick={() => setShowModal(false)}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="erp-modal-body">
          <div className="erp-form-grid">
            {tab === 'mileage' && (
              <>
                <div className="erp-field full">
                  <label htmlFor="m-model">
                    Vehicle Model <span className="required">*</span>
                  </label>
                  <input
                    id="m-model"
                    aria-label="Vehicle Model"
                    value={form.vehicleModel || ''}
                    onChange={(e) => setField('vehicleModel', e.target.value)}
                    placeholder="TATA LPT 4923"
                    required
                  />
                </div>
                <div className="erp-field">
                  <label htmlFor="m-route">Route</label>
                  <select
                    id="m-route"
                    value={form.routeId || ''}
                    onChange={(e) => setField('routeId', e.target.value)}
                  >
                    <option value="">Any route (model default)</option>
                    {routes.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="erp-field">
                  <label htmlFor="m-load">
                    Load State <span className="required">*</span>
                  </label>
                  <select
                    id="m-load"
                    value={form.loadType || 'LOAD'}
                    onChange={(e) => setField('loadType', e.target.value)}
                  >
                    <option value="LOAD">Loaded</option>
                    <option value="EMPTY">Empty</option>
                  </select>
                </div>
                <div className="erp-field">
                  <label htmlFor="m-kmpl">
                    km per litre <span className="required">*</span>
                  </label>
                  <input
                    id="m-kmpl"
                    aria-label="km per litre"
                    type="number"
                    min="0.1"
                    max="50"
                    step="0.01"
                    value={form.kmPerLitre || ''}
                    onChange={(e) => setField('kmPerLitre', e.target.value)}
                    placeholder="2.7"
                    required
                  />
                </div>
              </>
            )}

            {tab === 'fuel' && (
              <>
                <div className="erp-field full">
                  <label htmlFor="f-state">
                    State <span className="required">*</span>
                  </label>
                  <input
                    id="f-state"
                    aria-label="State"
                    value={form.state || ''}
                    onChange={(e) => setField('state', e.target.value.toUpperCase())}
                    placeholder="WEST BENGAL"
                    required
                  />
                  <span className="erp-field-hint">Must match the state names on your routes.</span>
                </div>
                <div className="erp-field">
                  <label htmlFor="f-rate">
                    Diesel Rate (₹/L) <span className="required">*</span>
                  </label>
                  <input
                    id="f-rate"
                    aria-label="Diesel Rate (₹/L)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.rate || ''}
                    onChange={(e) => setField('rate', e.target.value)}
                    placeholder="96.50"
                    required
                  />
                </div>
                <div className="erp-field">
                  <label htmlFor="f-date">Effective From</label>
                  <input
                    id="f-date"
                    aria-label="Effective From"
                    type="date"
                    value={form.effectiveDate || ''}
                    onChange={(e) => setField('effectiveDate', e.target.value)}
                  />
                </div>
              </>
            )}

            {tab === 'budget' && (
              <>
                <div className="erp-field full">
                  <label htmlFor="b-route">
                    Route <span className="required">*</span>
                  </label>
                  <select
                    id="b-route"
                    value={form.routeId || ''}
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
                </div>
                <div className="erp-field full">
                  <label htmlFor="b-model">Vehicle Model</label>
                  <input
                    id="b-model"
                    aria-label="Vehicle Model"
                    value={form.vehicleModel || ''}
                    onChange={(e) => setField('vehicleModel', e.target.value)}
                    placeholder="Blank = applies to every model"
                  />
                </div>
                <div className="erp-field">
                  <label htmlFor="b-serv">Servicing (₹)</label>
                  <input
                    id="b-serv"
                    aria-label="Servicing (₹)"
                    type="number"
                    min="0"
                    value={form.servicingAmount || ''}
                    onChange={(e) => setField('servicingAmount', e.target.value)}
                    placeholder="1000"
                  />
                  <span className="erp-field-hint">
                    Waived automatically when the same material is carried again.
                  </span>
                </div>
                <div className="erp-field">
                  <label htmlFor="b-border">Borders (₹)</label>
                  <input
                    id="b-border"
                    aria-label="Borders (₹)"
                    type="number"
                    min="0"
                    value={form.bordersAmount || ''}
                    onChange={(e) => setField('bordersAmount', e.target.value)}
                    placeholder="2000"
                  />
                </div>
                <div className="erp-field">
                  <label htmlFor="b-misc">Miscellaneous (₹)</label>
                  <input
                    id="b-misc"
                    aria-label="Miscellaneous (₹)"
                    type="number"
                    min="0"
                    value={form.miscAmount || ''}
                    onChange={(e) => setField('miscAmount', e.target.value)}
                    placeholder="500"
                  />
                </div>
                <div className="erp-field">
                  <label htmlFor="b-empty">Empty legs</label>
                  <select
                    id="b-empty"
                    value={form.emptyDieselOnly === false ? 'no' : 'yes'}
                    onChange={(e) => setField('emptyDieselOnly', e.target.value === 'yes')}
                  >
                    <option value="yes">Diesel only</option>
                    <option value="no">Include all costs</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="erp-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default AdvanceMasterModal;
