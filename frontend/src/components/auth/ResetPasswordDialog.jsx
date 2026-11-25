import { useEffect, useId, useState } from 'react';
import { Copy, KeyRound, Mail, RefreshCw, X } from 'lucide-react';
import { toast } from 'react-toastify';
import NewButton from '@/components/ui/NewButton';
import PasswordField from './PasswordField.jsx';
import { checkNewPassword, generatePassword } from './passwordRules';
import './ResetPasswordDialog.css';

/**
 * Reset someone else's password. Two ways:
 *  - Set a new password now (and tell the person yourself), or
 *  - Email them a link to set their own (only when they have an email).
 * Signing out of every device is on by default.
 *
 * Props:
 *   open, onClose
 *   user: { id, name, roleLabel, email|null }
 *   onSubmit(body) -> Promise<result>
 *     body = { mode:'set', password, signOut } | { mode:'email' }
 */
export default function ResetPasswordDialog({ open, onClose, user, onSubmit }) {
  const uid = useId();
  const [mode, setMode] = useState('set');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [signOut, setSignOut] = useState(true);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode('set');
    setPassword('');
    setConfirm('');
    setSignOut(true);
    setTouched(false);
    setBusy(false);
    setError('');
  }, [open, user?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open || !user) return null;

  const hasEmail = Boolean(user.email);
  const problem = mode === 'set' ? checkNewPassword(password, confirm) : null;

  const fillGenerated = () => {
    const generated = generatePassword();
    setPassword(generated);
    setConfirm(generated);
    setTouched(false);
    setError('');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success('Password copied');
    } catch {
      toast.error('Could not copy — select it and copy by hand');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    // The email mode is refused here too, not only by the disabled radio: a
    // profile can lose its email while the dialog is open.
    if (mode === 'email' && !user.email) {
      setError('This person has no email on their profile, so a link cannot be sent.');
      return;
    }
    setTouched(true);
    if (mode === 'set' && problem) return;
    setBusy(true);
    setError('');
    try {
      const body = mode === 'set' ? { mode: 'set', password, signOut } : { mode: 'email' };
      const res = await onSubmit(body);
      if (mode === 'set') {
        toast.success(
          `Password changed for ${user.name}${res?.signedOut ? ' — signed out everywhere' : ''}`,
        );
      } else {
        toast.success(
          `Reset link queued for ${user.name} (${res?.email || 'email on file'})`,
        );
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Could not reset the password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rpd-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !busy) onClose();
      }}
    >
      <div
        className="rpd-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rpd-title"
      >
        <div className="rpd-head">
          <h4 id="rpd-title">Reset password</h4>
          <button
            type="button"
            onClick={onClose}
            className="rpd-close"
            aria-label="Close"
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>

        <p className="rpd-who">
          <strong>{user.name}</strong>
          {user.roleLabel ? <span> — {user.roleLabel}</span> : null}
          {user.email ? <span className="rpd-email"> — {user.email}</span> : null}
        </p>

        <form onSubmit={submit} noValidate>
          <fieldset className="rpd-modes">
            <legend className="sr-only">How to reset</legend>
            <label className={`rpd-mode ${mode === 'set' ? 'is-on' : ''}`}>
              <input
                type="radio"
                name="rpd-mode"
                value="set"
                checked={mode === 'set'}
                onChange={() => setMode('set')}
                aria-labelledby={`${uid}-set`}
              />
              <KeyRound size={16} aria-hidden="true" />
              <span>
                <strong id={`${uid}-set`}>Set a new password</strong>
                <small>You tell {user.name} the new password.</small>
              </span>
            </label>
            <label
              className={`rpd-mode ${mode === 'email' ? 'is-on' : ''} ${hasEmail ? '' : 'is-off'}`}
              title={hasEmail ? undefined : 'This person has no email on their profile'}
            >
              <input
                type="radio"
                name="rpd-mode"
                value="email"
                checked={mode === 'email'}
                onChange={() => setMode('email')}
                disabled={!hasEmail}
                aria-labelledby={`${uid}-email`}
              />
              <Mail size={16} aria-hidden="true" />
              <span>
                <strong id={`${uid}-email`}>Email a reset link</strong>
                <small>
                  {hasEmail
                    ? `${user.name} sets their own. The link works for 24 hours.`
                    : 'No email on this profile.'}
                </small>
              </span>
            </label>
          </fieldset>

          {mode === 'set' ? (
            <div className="rpd-set">
              <PasswordField label="New password" value={password} onChange={setPassword} />
              <PasswordField
                label="Type it again"
                value={confirm}
                onChange={setConfirm}
                error={touched ? problem : null}
              />
              <div className="rpd-tools">
                <button type="button" className="rpd-tool" onClick={fillGenerated}>
                  <RefreshCw size={14} aria-hidden="true" /> Make one for me
                </button>
                <button type="button" className="rpd-tool" onClick={copy} disabled={!password}>
                  <Copy size={14} aria-hidden="true" /> Copy
                </button>
              </div>
              <label className="rpd-check" id={`${uid}-signout`}>
                <input
                  type="checkbox"
                  checked={signOut}
                  onChange={(e) => setSignOut(e.target.checked)}
                  aria-labelledby={`${uid}-signout`}
                />
                Sign {user.name} out of the website and the driver app
              </label>
            </div>
          ) : (
            <p className="rpd-note">
              We will email <strong>{user.email}</strong> a link to set a new password. Their
              current password keeps working until they use the link.
            </p>
          )}

          {error ? (
            <p className="pwf-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="rpd-actions">
            <NewButton
              variant="secondary"
              size="md"
              type="button"
              text="Cancel"
              onClick={onClose}
              disabled={busy}
            />
            <NewButton
              variant="primary"
              size="md"
              type="submit"
              text={busy ? 'Saving…' : mode === 'set' ? 'Change password' : 'Send link'}
              disabled={busy}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
