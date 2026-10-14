import { AlertTriangle } from 'lucide-react';

const RemoveFlagModal = ({ removeTarget, setRemoveTarget, removing, confirmRemove }) => (
  <div
    className="ff-modal-overlay"
    role="button"
    tabIndex={-1}
    aria-label="Close dialog"
    onClick={(e) => {
      if (e.target === e.currentTarget && !removing) setRemoveTarget(null);
    }}
    onKeyDown={(e) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!removing) setRemoveTarget(null);
      }
    }}
  >
    <div className="ff-modal" role="dialog" aria-modal="true" aria-labelledby="ff-remove-title">
      <div className="ff-modal__header">
        <div style={{ display: 'flex', gap: 14 }}>
          <span className="ff-confirm__icon">
            <AlertTriangle size={22} />
          </span>
          <div>
            <h2 className="ff-modal__title" id="ff-remove-title">
              Remove “{removeTarget}”?
            </h2>
            <p className="ff-modal__subtitle">
              It stops appearing here for all organizations. Each org keeps its stored value, so
              re-registering the key restores it.
            </p>
          </div>
        </div>
      </div>
      <div className="ff-modal__footer">
        <button
          type="button"
          className="ff-btn ff-btn--ghost"
          onClick={() => setRemoveTarget(null)}
          disabled={removing}
        >
          Cancel
        </button>
        <button
          type="button"
          className="ff-btn ff-btn--danger"
          onClick={confirmRemove}
          disabled={removing}
        >
          {removing ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </div>
  </div>
);

export default RemoveFlagModal;
