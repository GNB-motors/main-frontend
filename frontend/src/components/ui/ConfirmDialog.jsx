import React, { useCallback, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import ConfirmContext from './confirmContext';

/**
 * ConfirmDialog + useConfirm — the replacement for window.confirm().
 *
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: 'Delete this zone?',
 *     body: 'Vehicles inside it stop generating alerts until you recreate it.',
 *     confirmLabel: 'Delete zone',
 *     danger: true,
 *   });
 *   if (!ok) return;
 *   ...
 *
 * Mount <ConfirmDialogHost /> once near the app root (DashboardLayout).
 * The promise resolves true on confirm, false on cancel/Esc/backdrop.
 * Only one dialog is ever open; a second confirm() call queues nothing and
 * resolves false (callers must await sequentially).
 *
 * useConfirm is exported from ./confirmContext (kept out of this file so it
 * stays react-refresh clean).
 */

export function ConfirmDialogHost({ children }) {
  const [state, setState] = useState(null); // { options, resolve }
  const stateRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    if (stateRef.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      stateRef.current = { options, resolve };
      setState(stateRef.current);
    });
  }, []);

  const settle = useCallback((value) => {
    stateRef.current?.resolve(value);
    stateRef.current = null;
    setState(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && <ConfirmDialog options={state.options} onSettle={settle} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({ options, onSettle }) {
  const {
    title,
    body,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
  } = options;

  return (
    <div
      className="cdlg-overlay"
      role="presentation"
      onClick={() => onSettle(false)}
    >
      <div
        className="cdlg"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cdlg-head">
          {danger && <AlertTriangle size={18} className="cdlg-warn" aria-hidden="true" />}
          <h2 className="cdlg-title">{title}</h2>
        </div>
        {body && <p className="cdlg-body">{body}</p>}
        <div className="cdlg-actions">
          <button type="button" className="pshell-btn" onClick={() => onSettle(false)}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`pshell-btn ${danger ? 'cdlg-confirm--danger' : 'pshell-btn--primary'}`}
            onClick={() => onSettle(true)}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
