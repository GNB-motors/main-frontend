import { X } from 'lucide-react';

const NewPermissionModal = ({ form, setForm, addError, adding, setAddOpen, submitAdd }) => (
  <div
    className="ff-modal-overlay"
    role="button"
    tabIndex={-1}
    aria-label="Close dialog"
    onClick={(e) => {
      if (e.target === e.currentTarget && !adding) setAddOpen(false);
    }}
    onKeyDown={(e) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!adding) setAddOpen(false);
      }
    }}
  >
    <div className="ff-modal" role="dialog" aria-modal="true">
      <div className="ff-modal__header">
        <div>
          <h2 className="ff-modal__title">New permission</h2>
          <p className="ff-modal__subtitle">
            Custom permissions can be assigned to any global role.
          </p>
        </div>
        <button
          type="button"
          className="ff-icon-btn"
          onClick={() => setAddOpen(false)}
          disabled={adding}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
      <div className="ff-modal__body">
        {addError && (
          <div className="ff-alert ff-alert--error" role="alert">
            {addError}
          </div>
        )}
        <div className="ff-field">
          <label className="ff-field__label" htmlFor="rbac-perm-key">
            Key
          </label>
          <input
            id="rbac-perm-key"
            aria-label="Key"
            className="ff-input ff-mono"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            placeholder="e.g. crm"
            maxLength={80}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- first field of the dialog the user just opened
            autoFocus
          />
        </div>
        <div className="ff-field">
          <label className="ff-field__label" htmlFor="rbac-perm-group">
            Group
          </label>
          <input
            id="rbac-perm-group"
            aria-label="Group"
            className="ff-input"
            value={form.group}
            onChange={(e) => setForm({ ...form, group: e.target.value })}
            placeholder="e.g. CRM"
            maxLength={60}
          />
        </div>
        <div className="ff-field">
          <label className="ff-field__label" htmlFor="rbac-perm-label">
            Label
          </label>
          <input
            id="rbac-perm-label"
            aria-label="Label"
            className="ff-input"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="e.g. CRM"
            maxLength={120}
          />
        </div>
        <div className="ff-field">
          <label className="ff-field__label" htmlFor="rbac-perm-desc">
            Description <span className="ff-muted">(optional)</span>
          </label>
          <textarea
            id="rbac-perm-desc"
            aria-label="Description (optional)"
            className="ff-textarea"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={300}
          />
        </div>
        <div className="ff-field">
          <label className="ff-field__label" htmlFor="rbac-perm-flag">
            Feature flag <span className="ff-muted">(optional entitlement gate)</span>
          </label>
          <input
            id="rbac-perm-flag"
            aria-label="Feature flag (optional entitlement gate)"
            className="ff-input ff-mono"
            value={form.featureFlag}
            onChange={(e) => setForm({ ...form, featureFlag: e.target.value })}
            placeholder="e.g. insurance"
            maxLength={80}
          />
        </div>
      </div>
      <div className="ff-modal__footer">
        <button
          type="button"
          className="ff-btn ff-btn--ghost"
          onClick={() => setAddOpen(false)}
          disabled={adding}
        >
          Cancel
        </button>
        <button
          type="button"
          className="ff-btn ff-btn--primary"
          onClick={submitAdd}
          disabled={adding}
        >
          {adding ? 'Creating…' : 'Create'}
        </button>
      </div>
    </div>
  </div>
);

export default NewPermissionModal;
