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
 *     consequence: 'This cannot be undone from the app.', // optional amber callout
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
    consequence,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
  } = options;

  return (
    <div
      className="cdlg-overlay"
      role="presentation"
      // Only a click on the backdrop itself cancels; clicks inside the dialog
      // stop here, as they did when the dialog stopped them one level down.
      onClick={(e) => {
        if (e.target === e.currentTarget) onSettle(false);
        else e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onSettle(false);
        }
      }}
    >
      <div className="cdlg" role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="cdlg-head">
          {danger && <AlertTriangle size={18} className="cdlg-warn" aria-hidden="true" />}
          <h2 className="cdlg-title">{title}</h2>
        </div>
        {body && <p className="cdlg-body">{body}</p>}
        {consequence && <p className="cdlg-consequence">{consequence}</p>}
        <div className="cdlg-actions">
          <button type="button" className="pshell-btn" onClick={() => onSettle(false)}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`pshell-btn ${danger ? 'cdlg-confirm--danger' : 'pshell-btn--primary'}`}
            onClick={() => onSettle(true)}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- the alertdialog just opened; focus must move into it so Enter/Escape act on it
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
