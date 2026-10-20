import { useState } from 'react';

const ReasonModal = ({ title, label, confirmLabel, confirmClass, busy, onCancel, onConfirm }) => {
  const [text, setText] = useState('');
  return (
    <div
      className="ra-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !busy) onCancel();
      }}
    >
      <div className="ra-modal">
        <div className="ra-modal__head">{title}</div>
        <div className="ra-modal__body">
          <div className="ra-field__label" style={{ marginBottom: 8 }}>
            {label}
          </div>
          <textarea
            rows={3}
            className="ra-modal__textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="State your reason for audit logs and driver notification…"
            aria-label="Reason for audit log and driver notification"
          />
        </div>
        <div className="ra-modal__foot">
          <button type="button" className="ra-btn ra-btn--ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={`ra-btn ${confirmClass}`}
            onClick={() => onConfirm(text.trim())}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReasonModal;
