import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, KeyRound, LinkIcon } from 'lucide-react';
import AuthHelpLayout from '../../components/auth/AuthHelpLayout.jsx';
import PasswordField from '../../components/auth/PasswordField.jsx';
import { checkNewPassword } from '../../components/auth/passwordRules';
import { PasswordResetService } from '../../services/PasswordResetService';
import '../../components/ui/forms.css';

/**
 * /reset-password?token=…  The link from the reset email.
 * 1. Read the token once (the inline script in index.html has already moved it
 *    out of the address bar), then drop it from the URL.
 * 2. Ask the API whether it is still good, and whose it is.
 * 3. New password twice -> complete -> "Sign in".
 */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // The token is read exactly once, then thrown away: it must never sit in the
  // history, in a log line or in any other URL.
  const [token] = useState(() => {
    const fromWindow = typeof window !== 'undefined' ? window.__gnbResetToken : null;
    const fromQuery = params.get('token');
    if (typeof window !== 'undefined') {
      try {
        delete window.__gnbResetToken;
      } catch {
        window.__gnbResetToken = undefined;
      }
    }
    return String(fromWindow || fromQuery || '').trim();
  });

  const [phase, setPhase] = useState(token ? 'checking' : 'invalid'); // checking|form|saving|done|invalid
  const [who, setWho] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState('');

  // The token leaves the address bar before anything else can see it. The
  // router's own history state is kept, so Back still works.
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.history?.replaceState === 'function') {
      window.history.replaceState(window.history.state, '', '/reset-password');
    }
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    const ctrl = new AbortController();
    PasswordResetService.verifyReset(token, { signal: ctrl.signal })
      .then((data) => {
        if (data?.valid) {
          setWho(data);
          setPhase('form');
        } else {
          setPhase('invalid');
        }
      })
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return;
        setPhase('invalid');
      });
    return () => ctrl.abort();
  }, [token]);

  const problem = checkNewPassword(password, confirm);

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (problem || phase === 'saving') return;
    setPhase('saving');
    setServerError('');
    try {
      await PasswordResetService.completeReset(token, password);
      setPhase('done');
    } catch (err) {
      setPhase('form');
      setServerError(err?.message || 'Could not change the password. Ask for a new link.');
    }
  };

  if (phase === 'invalid') {
    return (
      <AuthHelpLayout
        title="This link does not work"
        subtitle="Reset links work once and only for a short time."
      >
        <section className="auth-help-option">
          <span className="auth-help-icon" aria-hidden="true">
            <LinkIcon size={20} />
          </span>
          <div>
            <p className="auth-help-option-text">
              The link has expired, was already used, or a newer link replaced it.
            </p>
            <div className="auth-help-actions">
              <Link to="/forgot-password" className="auth-help-action is-primary">
                Send a new link
              </Link>
              <Link to="/login" className="auth-help-action">
                Back to sign in
              </Link>
            </div>
          </div>
        </section>
      </AuthHelpLayout>
    );
  }

  if (phase === 'done') {
    return (
      <AuthHelpLayout title="Password changed" subtitle="You were signed out on every device.">
        <section className="auth-help-option" aria-live="polite">
          <span className="auth-help-icon" aria-hidden="true">
            <CheckCircle2 size={20} />
          </span>
          <div>
            <p className="auth-help-option-text">Sign in with your new password.</p>
            <div className="auth-help-actions">
              <button
                type="button"
                className="auth-help-action is-primary"
                onClick={() => navigate('/login', { replace: true })}
              >
                Sign in
              </button>
            </div>
          </div>
        </section>
      </AuthHelpLayout>
    );
  }

  return (
    <AuthHelpLayout
      title="Set a new password"
      subtitle={
        who
          ? `For ${who.firstName}${who.orgName ? ` — ${who.orgName}` : ''}${who.role ? ` (${who.role})` : ''}`
          : 'Checking your link…'
      }
    >
      {phase === 'checking' ? (
        <p className="auth-help-option-text">Checking your link…</p>
      ) : (
        <form className="fp-form" onSubmit={submit} noValidate>
          <PasswordField
            label="New password"
            value={password}
            onChange={setPassword}
            name="new-password"
          />
          <PasswordField
            label="Type it again"
            value={confirm}
            onChange={setConfirm}
            name="confirm-password"
            error={touched ? problem : null}
          />
          <p className="pwf-hint">8 to 72 characters.</p>
          {serverError ? (
            <p className="pwf-error" role="alert">
              {serverError}
            </p>
          ) : null}
          <button
            type="submit"
            className="auth-help-action is-primary fp-submit"
            disabled={phase === 'saving'}
          >
            <KeyRound size={15} aria-hidden="true" />
            {phase === 'saving' ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      )}
    </AuthHelpLayout>
  );
}
