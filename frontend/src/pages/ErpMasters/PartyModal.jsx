import { X } from 'lucide-react';

const PartyModal = ({
  editingId,
  setShowModal,
  handleSubmit,
  form,
  setField,
  setContact,
  kams,
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
        <h2>{editingId ? 'Edit Party' : 'Add Party'}</h2>
        <button className="btn-icon" onClick={() => setShowModal(false)}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="erp-modal-body">
          <div className="erp-form-grid">
            <div className="erp-field">
              <label htmlFor="party-name">
                Party Name <span className="required">*</span>
              </label>
              <input
                id="party-name"
                aria-label="Party Name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Berger Paints"
                required
              />
            </div>

            <div className="erp-field">
              <label htmlFor="party-code">
                Code <span className="required">*</span>
              </label>
              <input
                id="party-code"
                aria-label="Code"
                value={form.code}
                onChange={(e) => setField('code', e.target.value.toUpperCase())}
                placeholder="BERGER"
                required
              />
              <span className="erp-field-hint">Unique within your organization</span>
            </div>

            <div className="erp-field">
              <label htmlFor="party-credit-limit">Credit Limit (₹)</label>
              <input
                id="party-credit-limit"
                aria-label="Credit Limit (₹)"
                type="number"
                min="0"
                value={form.creditLimit}
                onChange={(e) => setField('creditLimit', e.target.value)}
                placeholder="400000"
              />
            </div>

            <div className="erp-field">
              <label htmlFor="party-credit-days">Credit Days</label>
              <input
                id="party-credit-days"
                aria-label="Credit Days"
                type="number"
                min="0"
                max="365"
                value={form.creditDays}
                onChange={(e) => setField('creditDays', e.target.value)}
                placeholder="30"
              />
            </div>

            <div className="erp-field full">
              <label htmlFor="party-kam">Key Account Manager</label>
              <select
                id="party-kam"
                value={form.kamId}
                onChange={(e) => setField('kamId', e.target.value)}
              >
                <option value="">Unassigned</option>
                {kams.map((kam) => (
                  <option key={kam._id} value={kam._id}>
                    {kam.firstName} {kam.lastName}
                  </option>
                ))}
              </select>
              <span className="erp-field-hint">
                {kams.length === 0
                  ? 'No users with the KAM role yet — create one under Employees.'
                  : 'Call schedules can reassign this.'}
              </span>
            </div>

            <div className="erp-field">
              <label htmlFor="party-gstin">GSTIN</label>
              <input
                id="party-gstin"
                aria-label="GSTIN"
                value={form.gstin}
                onChange={(e) => setField('gstin', e.target.value.toUpperCase())}
                placeholder="19AABCB1234C1ZK"
              />
            </div>

            <div className="erp-field">
              <label htmlFor="party-pan">PAN</label>
              <input
                id="party-pan"
                aria-label="PAN"
                value={form.pan}
                onChange={(e) => setField('pan', e.target.value.toUpperCase())}
                placeholder="AABCB1234C"
              />
            </div>

            <div className="erp-field">
              <label htmlFor="party-contact-person">Contact Person</label>
              <input
                id="party-contact-person"
                aria-label="Contact Person"
                value={form.contact.person}
                onChange={(e) => setContact('person', e.target.value)}
              />
            </div>

            <div className="erp-field">
              <label htmlFor="party-contact-phone">Contact Phone</label>
              <input
                id="party-contact-phone"
                aria-label="Contact Phone"
                value={form.contact.phone}
                onChange={(e) => setContact('phone', e.target.value)}
              />
            </div>

            <div className="erp-field full">
              <label htmlFor="party-contact-email">Contact Email</label>
              <input
                id="party-contact-email"
                aria-label="Contact Email"
                type="email"
                value={form.contact.email}
                onChange={(e) => setContact('email', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="erp-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Party'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default PartyModal;
