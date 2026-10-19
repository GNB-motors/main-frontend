import { Mail, Phone, ShieldCheck, Users } from 'lucide-react';
import AuthHelpLayout from '../../components/auth/AuthHelpLayout.jsx';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../Support/supportContact.js';

// There is no self-serve reset link: an employee's password is set by their
// owner/manager on the employee record, and an owner's by GNB support.
const ForgotPasswordPage = () => (
  <AuthHelpLayout
    title="Forgot your password?"
    subtitle="Passwords are reset by a person, not by email link. Who to contact depends on your account."
  >
    <div className="auth-help-options">
      <section className="auth-help-option" aria-labelledby="fp-employee">
        <span className="auth-help-icon" aria-hidden="true">
          <Users size={20} />
        </span>
        <div>
          <h2 id="fp-employee" className="auth-help-option-title">
            I&apos;m an employee
          </h2>
          <p className="auth-help-option-meta">Manager or driver</p>
          <p className="auth-help-option-text">
            Contact your manager or company owner. They can set a new password for you in GNB.
          </p>
        </div>
      </section>

      <section className="auth-help-option" aria-labelledby="fp-admin">
        <span className="auth-help-icon" aria-hidden="true">
          <ShieldCheck size={20} />
        </span>
        <div>
          <h2 id="fp-admin" className="auth-help-option-title">
            I&apos;m an owner or admin
          </h2>
          <p className="auth-help-option-meta">I manage my company&apos;s GNB account</p>
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

export default ForgotPasswordPage;
