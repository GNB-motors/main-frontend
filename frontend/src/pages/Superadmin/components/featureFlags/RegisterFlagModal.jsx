import { X } from 'lucide-react';

const RegisterFlagModal = ({
  newKey,
  setNewKey,
  newLabel,
  setNewLabel,
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
    <div className="ff-modal" role="dialog" aria-modal="true" aria-labelledby="ff-add-title">
      <div className="ff-modal__header">
        <div>
          <h2 className="ff-modal__title" id="ff-add-title">
            Register a new feature flag
          </h2>
          <p className="ff-modal__subtitle">
            New flags become available to all organizations. Each one starts denied — flip the
            toggle to enable it.
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
          <label className="ff-field__label" htmlFor="ff-new-key">
            Key (slug)
          </label>
          <input
            id="ff-new-key"
            aria-label="Key (slug)"
            className="ff-input ff-mono"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="e.g. inventoryTracker"
            maxLength={64}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- first field of the dialog the user just opened
            autoFocus
          />
          <span className="ff-field__help">
            Start with a letter. Letters, digits, _, - only. Max 64 chars.
          </span>
        </div>

        <div className="ff-field">
          <label className="ff-field__label" htmlFor="ff-new-label">
            Display label
          </label>
          <input
            id="ff-new-label"
            aria-label="Display label"
            className="ff-input"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Inventory Tracker"
            maxLength={120}
          />
        </div>

        <div className="ff-field">
          <label className="ff-field__label" htmlFor="ff-new-desc">
            Description <span className="ff-muted">(optional)</span>
          </label>
          <textarea
            id="ff-new-desc"
            aria-label="Description (optional)"
            className="ff-textarea"
            rows={2}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            maxLength={500}
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
          {adding ? 'Registering…' : 'Register'}
        </button>
      </div>
    </div>
  </div>
);

export default RegisterFlagModal;
