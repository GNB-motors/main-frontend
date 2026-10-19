import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, Phone } from 'lucide-react';
import AuthHelpLayout from '../../components/auth/AuthHelpLayout.jsx';

const CONTACT_EMAIL = 'gnbmotors60@gmail.com';
const CONTACT_PHONE = '9831208946';

const ContactPage = () => (
  <AuthHelpLayout title="Contact us" subtitle="Get in touch with us. We're here to help!">
    <div className="auth-help-list">
      <a href={`mailto:${CONTACT_EMAIL}`} className="auth-help-row">
        <span className="auth-help-icon" aria-hidden="true">
          <Mail size={18} />
        </span>
        <span className="auth-help-row-text">
          <span className="auth-help-row-label">Email</span>
          <span className="auth-help-row-value">{CONTACT_EMAIL}</span>
        </span>
        <ArrowUpRight size={16} className="auth-help-row-go" aria-hidden="true" />
      </a>
      <a href={`tel:${CONTACT_PHONE}`} className="auth-help-row">
        <span className="auth-help-icon" aria-hidden="true">
          <Phone size={18} />
        </span>
        <span className="auth-help-row-text">
          <span className="auth-help-row-label">Phone</span>
          <span className="auth-help-row-value">{CONTACT_PHONE}</span>
        </span>
        <ArrowUpRight size={16} className="auth-help-row-go" aria-hidden="true" />
      </a>
    </div>

    <p className="auth-help-footnote">
      Already have an account? <Link to="/login">Sign in</Link>
    </p>
  </AuthHelpLayout>
);

export default ContactPage;
