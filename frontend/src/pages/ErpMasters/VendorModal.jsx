import { X } from 'lucide-react';

const VendorModal = ({
  editingId,
  setShowModal,
  handleSubmit,
  form,
  setField,
  setContact,
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
        <h2>{editingId ? 'Edit Vendor' : 'Add Vendor'}</h2>
        <button className="btn-icon" onClick={() => setShowModal(false)}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="erp-modal-body">
          <div className="erp-form-grid">
            <div className="erp-field">
              <label htmlFor="v-name">
                Vendor Name <span className="required">*</span>
              </label>
              <input
                id="v-name"
                aria-label="Vendor Name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                required
              />
            </div>
            <div className="erp-field">
              <label htmlFor="v-code">
                Code <span className="required">*</span>
              </label>
              <input
                id="v-code"
                aria-label="Code"
                value={form.code}
                onChange={(e) => setField('code', e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="erp-field">
              <label htmlFor="v-gstin">GSTIN</label>
              <input
                id="v-gstin"
                aria-label="GSTIN"
                value={form.gstin}
                onChange={(e) => setField('gstin', e.target.value.toUpperCase())}
              />
            </div>
            <div className="erp-field">
              <label htmlFor="v-pan">PAN</label>
              <input
                id="v-pan"
                aria-label="PAN"
                value={form.pan}
                onChange={(e) => setField('pan', e.target.value.toUpperCase())}
              />
            </div>
            <div className="erp-field">
              <label htmlFor="v-person">Contact Person</label>
              <input
                id="v-person"
                aria-label="Contact Person"
                value={form.contact.person}
                onChange={(e) => setContact('person', e.target.value)}
              />
            </div>
            <div className="erp-field">
              <label htmlFor="v-phone">Contact Phone</label>
              <input
                id="v-phone"
                aria-label="Contact Phone"
                value={form.contact.phone}
                onChange={(e) => setContact('phone', e.target.value)}
              />
            </div>
            <div className="erp-field">
              <label htmlFor="v-tdssec">TDS Section</label>
              <input
                id="v-tdssec"
                aria-label="TDS Section"
                value={form.tdsSection}
                onChange={(e) => setField('tdsSection', e.target.value)}
                placeholder="194C"
              />
            </div>
            <div className="erp-field">
              <label htmlFor="v-tdsrate">TDS Rate (%)</label>
              <input
                id="v-tdsrate"
                aria-label="TDS Rate (%)"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.tdsRate}
                onChange={(e) => setField('tdsRate', e.target.value)}
              />
            </div>
            <div className="erp-field full">
              <label htmlFor="v-tankers">Tankers</label>
              <textarea
                id="v-tankers"
                aria-label="Tankers"
                value={form.tankersText}
                onChange={(e) => setField('tankersText', e.target.value)}
                placeholder={'WB11AA1111, 30\nWB11BB2222, 34'}
              />
              <span className="erp-field-hint">
                One per line: registration number, capacity in KL.
              </span>
            </div>
          </div>
        </div>

        <div className="erp-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Vendor'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default VendorModal;
