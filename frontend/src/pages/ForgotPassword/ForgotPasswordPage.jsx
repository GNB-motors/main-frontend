import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MailCheck, Phone, ShieldCheck, Users } from 'lucide-react';
import AuthHelpLayout from '../../components/auth/AuthHelpLayout.jsx';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../Support/supportContact.js';
import { PasswordResetService } from '../../services/PasswordResetService';
import '../../components/ui/forms.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Forgot password: anyone whose account has an email gets a reset link.
 * Drivers without an email still ask their owner or manager, who can now set
 * one from the Employees page.
 *
 * The copy says "30 minutes", matching the backend default
 * PASSWORD_RESET_TTL_MIN=30. If that env changes, change the copy too.
 */
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [message, setMessage] = useState('');

  const valid = EMAIL_RE.test(email.trim());

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || state === 'sending') return;
    setState('sending');
    setMessage('');
    try {
      await PasswordResetService.requestReset(email.trim());
      setState('sent');
    } catch (err) {
      setState('error');
      setMessage(
        err?.status === 429
          ? 'Too many requests. Please wait a while and try again.'
          : err?.message || 'Could not send the email just now. Try again in a minute.',
      );
    }
  };

  return (
    <AuthHelpLayout
      title="Forgot your password?"
      subtitle="Enter the email on your GNB account and we will send you a link to set a new password."
    >
      {state === 'sent' ? (
        <section className="auth-help-option" aria-live="polite">
          <span className="auth-help-icon" aria-hidden="true">
            <MailCheck size={20} />
          </span>
          <div>
            <h2 className="auth-help-option-title">Check your email</h2>
            <p className="auth-help-option-text">
              If an account uses <strong>{email.trim()}</strong>, a reset link is on its way. It
              works for 30 minutes. Check spam if it does not arrive in a few minutes.
            </p>
            <div className="auth-help-actions">
              <button
                type="button"
                className="auth-help-action"
                onClick={() => {
                  setState('idle');
                  setMessage('');
                }}
              >
                Use a different email
              </button>
              <Link to="/login" className="auth-help-action is-primary">
                Back to sign in
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <form className="fp-form" onSubmit={submit} noValidate>
          <label htmlFor="fp-email" id="fp-email-label" className="pwf-label">
            Email
          </label>
          <input
            id="fp-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-labelledby="fp-email-label"
            className="pwf-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
          {state === 'error' ? (
            <p className="pwf-error" role="alert">
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            className="auth-help-action is-primary fp-submit"
            disabled={!valid || state === 'sending'}
          >
            <Mail size={15} aria-hidden="true" />
            {state === 'sending' ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <div className="auth-help-options fp-other">
        <section className="auth-help-option" aria-labelledby="fp-employee">
          <span className="auth-help-icon" aria-hidden="true">
            <Users size={20} />
          </span>
          <div>
            <h2 id="fp-employee" className="auth-help-option-title">
              No email on your account?
            </h2>
            <p className="auth-help-option-meta">Most drivers</p>
            <p className="auth-help-option-text">
              Ask your manager or company owner. They can set a new password for you from the
              Employees page in GNB. Drivers can also sign in to the app with a code sent to their
              phone.
            </p>
          </div>
        </section>

        <section className="auth-help-option" aria-labelledby="fp-admin">
          <span className="auth-help-icon" aria-hidden="true">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 id="fp-admin" className="auth-help-option-title">
              Still stuck?
            </h2>
            <p className="auth-help-option-meta">Owners and admins</p>
            <p className="auth-help-option-text">
              Contact the GNB support team and we&apos;ll reset it for you.
            </p>
            <div className="auth-help-actions">
              <a href={`tel:${SUPPORT_PHONE}`} className="auth-help-action is-primary">
                <Phone size={15} aria-hidden="true" />
                {SUPPORT_PHONE}
              </a>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="auth-help-action">
                <Mail size={15} aria-hidden="true" />
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </section>
      </div>
    </AuthHelpLayout>
  );
};

export default ForgotPasswordPage;
