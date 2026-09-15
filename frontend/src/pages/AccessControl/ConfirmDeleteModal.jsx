import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * Styled delete-confirm modal (matches the ff-modal look used by RoleFormModal /
 * AssignRoleDrawer) — replaces the browser's native confirm() for role deletion.
 *
 * Props:
 *  - open, onClose, onConfirm(): control + actions
 *  - title, message: copy
 *  - itemName: the thing being deleted (rendered prominently)
 *  - confirmLabel: button text (default "Delete")
 *  - busy: disables actions + shows a working state while the delete runs
 */
const ConfirmDeleteModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Delete',
  message = 'This action cannot be undone.',
  itemName = '',
  confirmLabel = 'Delete',
  busy = false,
}) => {
  if (!open) return null;

  const handleOverlayKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!busy) onClose();
    }
  };

  return (
    <div
      className="ff-modal-overlay"
      role="button"
      tabIndex={-1}
      aria-label="Close dialog"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
      onKeyDown={handleOverlayKeyDown}
    >
      <div className="ff-modal" role="dialog" aria-modal="true">
        <div className="ff-modal__header">
          <div>
            <h2 className="ff-modal__title">{title}</h2>
            <p className="ff-modal__subtitle">{message}</p>
          </div>
          <button type="button" className="ff-icon-btn" onClick={onClose} disabled={busy} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="ff-modal__body">
          <div className="ff-alert ff-alert--error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} />
            {itemName
              ? <span>You are about to delete <strong>{itemName}</strong>.</span>
              : <span>This action cannot be undone.</span>}
          </div>
        </div>

        <div className="ff-modal__footer">
          <button type="button" className="ff-btn ff-btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="ff-btn ff-btn--danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
