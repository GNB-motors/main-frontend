import { X } from 'lucide-react';

const BASE_ROLE_OPTIONS = ['MANAGER', 'DRIVER', 'FIELD_AGENT'];

const CreateRoleModal = ({
  newName,
  setNewName,
  newBaseRole,
  setNewBaseRole,
  newDescription,
  setNewDescription,
  addError,
  adding,
  setAddOpen,
  submitAdd,
}) => (
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
          <h2 className="ff-modal__title">Create a global role</h2>
          <p className="ff-modal__subtitle">
            Reusable across all enterprises. Assign permissions after creating it.
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
          <label className="ff-field__label" htmlFor="rbac-new-name">
            Role name
          </label>
          <input
            id="rbac-new-name"
            aria-label="Role name"
            className="ff-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Finance Manager"
            maxLength={60}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- first field of the dialog the user just opened
            autoFocus
          />
        </div>
        <div className="ff-field">
          <label className="ff-field__label" htmlFor="rbac-new-base">
            Base role (compatibility)
          </label>
          <select
            id="rbac-new-base"
            className="rbac-select"
            value={newBaseRole}
            onChange={(e) => setNewBaseRole(e.target.value)}
          >
            {BASE_ROLE_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <span className="ff-field__help">
            Maps this role onto an existing access tier so legacy route guards keep working.
          </span>
        </div>
        <div className="ff-field">
          <label className="ff-field__label" htmlFor="rbac-new-desc">
            Description <span className="ff-muted">(optional)</span>
          </label>
          <textarea
            id="rbac-new-desc"
            aria-label="Description (optional)"
            className="ff-textarea"
            rows={2}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            maxLength={300}
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
          {adding ? 'Creating…' : 'Create role'}
        </button>
      </div>
    </div>
  </div>
);

export default CreateRoleModal;
